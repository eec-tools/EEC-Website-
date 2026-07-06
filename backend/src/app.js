const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const config = require("./config/env");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const healthRouter = require("./routes/health");
const staticDataRouter = require("./routes/staticData");
const authRouter = require("./routes/auth");
const uploadRouter = require("./routes/upload");
const filesRouter = require("./routes/files");
const buyerIntakeRouter = require("./routes/buyerIntake");
const supplierApplicationRouter = require("./routes/supplierApplication");
const leadsRouter = require("./routes/leads");
const newsletterRouter = require("./routes/newsletter");
const adminRouter = require("./routes/admin");
const googleAuthRouter = require("./routes/googleAuth");

function buildApp() {
  const app = express();

  const corsOrigins = config.corsOrigins === "*" ? "*" : config.corsOrigins.split(",");
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));

  const api = express.Router();
  api.use(healthRouter);
  api.use(staticDataRouter);
  api.use(authRouter);
  api.use(uploadRouter);
  api.use(filesRouter);
  api.use(buyerIntakeRouter);
  api.use(supplierApplicationRouter);
  api.use(leadsRouter);
  api.use(newsletterRouter);
  api.use(adminRouter);
  api.use(googleAuthRouter);

  app.use("/api", api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = buildApp;
