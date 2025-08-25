require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const studentRouter = require('./route/studentRouter');
const accountRouter = require('./route/accountRouter');
const permissionRouter = require('./route/permissionRouter');
const groupRouter = require('./route/groupRouter');
const sequelize = require('./config/dbConfig');
const cors = require('cors');

//Config use port and hostname from .env
const PORT = process.env.PORT || 8181;
const HOST_NAME = process.env.HOST_NAME || 'localhost';

//Config app use json
app.use(express.json());

// middleware for CORS
const allowedOrigins = ['http://localhost:3000', 'http://localhost:4000']; // cho PROD
let corsOptions;

if (process.env.NODE_ENV === 'production') {
  // Chỉ cho phép origin nằm trong danh sách
  corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // cho Postman
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `CORS policy does not allow access from origin ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true
  };
} else {
  // DEV: cho phép tất cả
  corsOptions = {
    origin: '*',
    credentials: true
  };
}

app.use(cors(corsOptions));


// Use file api
app.use('/v1', studentRouter);
app.use(accountRouter);
app.use('/v1', permissionRouter);
app.use('/v1', groupRouter);

// Tự động tạo bảng khi khởi động server
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced!');
    app.listen(PORT, HOST_NAME, () => {
      console.log(`Server is running at http://${HOST_NAME}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to sync database:', err);
  });