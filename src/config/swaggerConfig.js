const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "IT Dream API",
      version: "1.0.0",
      description: "Tài liệu API với Swagger cho IT Dream"
    },
    servers: [
      {
        url: "http://localhost:8181"
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Chú ý: đổi đúng thư mục chứa router
  apis: [path.join(__dirname, "../route/*.js")],
};

const swaggerSpecs = swaggerJsdoc(options);
module.exports = swaggerSpecs;
