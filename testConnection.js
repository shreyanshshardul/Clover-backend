const mongoose = require("mongoose");

const uri = "mongodb+srv://shreyanshshardul7_db_user:KcQHb66XUHOb3QqS@cluster0.w6fs4tb.mongodb.net/Clover?retryWrites=true&w=majority";

mongoose
  .connect(uri)
  .then(() => {
    console.log("✅ Connected successfully to MongoDB Atlas!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  });
