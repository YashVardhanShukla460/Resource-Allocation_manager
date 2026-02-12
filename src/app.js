const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", routes);

app.use((err, _req, res, _next) => {
  const statusCode = err.code && Number.isInteger(err.code) ? err.code : 500;
  res.status(statusCode).json({
    message: err.message || "Unexpected server error"
  });
});

module.exports = app;
