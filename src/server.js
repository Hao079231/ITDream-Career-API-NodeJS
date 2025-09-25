require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const sequelize = require('./config/dbConfig');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swaggerConfig');
const { ensureIndex } = require('./service/simulationSearch');
const fs = require('fs');

// Tự động import tất cả file trong thư mục route
const routePath = path.join(__dirname, 'route');
const routers = {};

fs.readdirSync(routePath).forEach(file => {
  // Chỉ import các file .js
  if (file.endsWith('.js')) {
    const routerName = file.replace('.js', ''); // Lấy tên file không có .js
    routers[routerName] = require(`./route/${routerName}`);
  }
});

//Config use port and hostname from .env
const PORT = process.env.PORT || 8181;
const HOST_NAME = process.env.HOST_NAME || 'localhost';

//Config app use json
app.use(express.json());

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

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
app.use('/v1', routers.studentRouter);
app.use(routers.accountRouter);
app.use('/v1', routers.permissionRouter);
app.use('/v1', routers.groupRouter);
app.use('/v1', routers.educatorRouter);
app.use('/v1', routers.specializationRouter);
app.use('/v1', routers.simulationRouter);
app.use('/v1', routers.taskRouter);

(async () => {
  await ensureIndex(); // chỉ chạy 1 lần khi app start
})();

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