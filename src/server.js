require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const apiRouter = require('./route/api');
const sequelize = require('./config/dbConfig');

//Config use port and hostname from .env
const PORT = process.env.PORT || 8181;
const HOST_NAME = process.env.HOST_NAME || 'localhost';

//Config app use json
app.use(express.json());

// Use file api
app.use('/v1', apiRouter);

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