require("dotenv").config();
const store = require("./store");
const events = require("./events");
const socketioJwt = require("socketio-jwt");
const cors = require("cors");
const router = require("./routes");
const formidableMiddleware = require("express-formidable");
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcrypt"); // ✅ Replaced argon2 with bcrypt
const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const { AsyncNedb } = require("nedb-async");
const mediasoup = require("./mediasoup");
const Meeting = require("./models/Meeting");

module.exports = () => {
  // Initialize store
  store.rooms = new AsyncNedb();
  store.peers = new AsyncNedb();
  store.onlineUsers = new Map();

  // ✅ Socket authentication setup
  store.io.sockets
    .on(
      "connection",
      socketioJwt.authorize({
        secret: store.config.secret,
        timeout: 15000,
      })
    )
    .on("authenticated", (socket) => {
      const { email, id } = socket.decoded_token;
      console.log(`Socket connected: ${email}`.cyan);

      mediasoup.initSocket(socket);
      socket.join(id);

      events.forEach((event) =>
        socket.on(event.tag, (data) => event.callback(socket, data))
      );

      store.socketIds.push(socket.id);
      store.sockets[socket.id] = socket;

      if (!store.socketsByUserID[id]) store.socketsByUserID[id] = [];
      store.socketsByUserID[id].push(socket);
      store.userIDsBySocketID[socket.id] = id;

      store.onlineUsers.set(socket, { id, status: "online" });
      store.io.emit("onlineUsers", Array.from(store.onlineUsers.values()));

      socket.on("disconnect", () => {
        if (store.roomIDs[socket.id]) {
          let roomID = store.roomIDs[socket.id];
          store.consumerUserIDs[roomID].splice(
            store.consumerUserIDs[roomID].indexOf(socket.id),
            1
          );
          socket.to(roomID).emit("consumers", {
            content: store.consumerUserIDs[roomID],
            timestamp: Date.now(),
          });
          socket.to(roomID).emit("leave", { socketID: socket.id });
        }

        Meeting.update({}, { $pull: { peers: socket.id } }, { multi: true });
        store.peers.remove({ socketID: socket.id }, { multi: true });

        console.log(`Socket disconnected: ${email}`.cyan);
        store.socketIds.splice(store.socketIds.indexOf(socket.id), 1);
        store.sockets[socket.id] = undefined;

        User.findOneAndUpdate({ _id: id }, { $set: { lastOnline: Date.now() } })
          .then(() => console.log("Updated last online for:", id))
          .catch((err) => console.log(err));

        store.onlineUsers.delete(socket);
        store.io.emit("onlineUsers", Array.from(store.onlineUsers.values()));
      });
    });

  // ✅ Middleware setup
  store.app.use(cors());
  store.app.use(formidableMiddleware());
  store.app.use(passport.initialize());

  // ✅ JWT strategy
  passport.use(
    "jwt",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: store.config.secret,
      },
      (payload, done) => {
        User.findById(payload.id)
          .then((user) => {
            if (user) return done(null, user);
            return done(null, false);
          })
          .catch((err) => console.log(err));
      }
    )
  );

  store.app.use("/api", router);

  // ✅ MongoDB connection setup
  const mongooseConnect = async () => {
    console.log("Connecting to MongoDB...".yellow);
    mongoose.set("strictQuery", false);

    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log("✅ Connected to MongoDB Atlas!".green);

      // Create or update root user
      const { username, email, password, firstName, lastName } =
        store.config.rootUser;

      const existingUser = await User.findOne({ email });
      const hashedPassword = await bcrypt.hash(password, 10); // ✅ Updated hashing

      if (!existingUser) {
        await new User({
          username,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          level: "root",
        }).save();
        console.log("👑 Root user created!");
      } else {
        await User.findOneAndUpdate(
          { email },
          {
            $set: {
              username,
              email,
              password: hashedPassword,
              firstName,
              lastName,
              level: "root",
            },
          }
        );
        console.log("👑 Root user updated!");
      }

      await Meeting.updateMany({}, { $set: { peers: [] } });
      store.connected = true;
    } catch (err) {
      console.error("❌ Unable to connect to MongoDB:", err);
      console.log("Retrying in 10 seconds...".yellow);
      setTimeout(mongooseConnect, 10000);
    }
  };

  mongooseConnect();
};
