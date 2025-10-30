require('dotenv').config();
const info = require('./version.json');

module.exports = {
  appVersion: info.version,
  appBuild: info.build,

  // ✅ Server port
  port: process.env.PORT || 4000,

  // ✅ JWT secret
  secret: process.env.AUTH_SECRET || 'jwt-default-secret',

  // ✅ MongoDB configuration
  mongo: {
    uri:
      process.env.MONGO_URI ||
      'mongodb+srv://shreyanshshardul7_db_user:FyTn%21qhsZ.5WFnR@clover.tj3vqh2.mongodb.net/Clover?retryWrites=true&w=majority',
    srv: true,
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
    authenticationDatabase: process.env.MONGO_AUTHENTICATION_DATABASE,
    hostname: process.env.MONGO_HOSTNAME,
    port: process.env.MONGO_PORT,
    database: process.env.MONGO_DATABASE_NAME || 'Clover',
  },

  // ✅ Data folder
  dataFolder: './data',

  // ✅ Default admin account (root user)
  rootUser: {
    username: process.env.ROOT_USER_USERNAME,
    email: process.env.ROOT_USER_EMAIL,
    password: process.env.ROOT_USER_PASSWORD,
    firstName: process.env.ROOT_USER_FIRST_NAME,
    lastName: process.env.ROOT_USER_LAST_NAME,
  },

  // ✅ IP configuration for mediasoup
  ipAddress: {
    ip: process.env.MAPPED_IP === 'true' ? '0.0.0.0' : process.env.PUBLIC_IP_ADDRESS,
    announcedIp: process.env.MAPPED_IP === 'true' ? process.env.PUBLIC_IP_ADDRESS : null,
  },

  // ✅ Email (disabled for now)
  nodemailerEnabled: false,
  nodemailer: {
    from: 'admin@example.com',
  },
  nodemailerTransport: {
    service: undefined,
    host: 'smtp.yourdomain.tld',
    port: 587,
    secure: false,
    auth: {
      user: 'your_smtp_user',
      pass: 'your_smtp_password',
    },
  },

  // ✅ Static configuration
  retryAfter: 10000,
  sizes: [256, 512, 1024, 2048],

  // ✅ Mediasoup codecs
  mediaCodecs: [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: 'video',
      mimeType: 'video/VP8',
      clockRate: 90000,
      parameters: { 'x-google-start-bitrate': 1000 },
    },
  ],

  // ✅ RTC ports
  rtcMinPort: 10000,
  rtcMaxPort: 12000,
  mediasoupLogLevel: 'warn',
};
