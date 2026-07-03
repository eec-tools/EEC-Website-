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
const adminRouter = require("./routes/admin");
const googleAuthRouter = require("./routes/googleAuth");

function buildApp() {
  const app = express();

  // Note: the `cors` package treats a literal "*" string for methods/allowedHeaders
  // as an actual header/method name, not a wildcard (unlike FastAPI's allow_headers=["*"]).
  // Omitting them makes `cors` reflect back whatever the browser's preflight requested,
  // which is the correct equivalent of "allow any".
  const corsOrigins = config.corsOrigins === "*" ? "*" : config.corsOrigins.split(",");
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());

  const api = express.Router();
  api.use(healthRouter);
  api.use(staticDataRouter);
  api.use(authRouter);
  api.use(uploadRouter);
  api.use(filesRouter);
  api.use(buyerIntakeRouter);
  api.use(supplierApplicationRouter);
  api.use(leadsRouter);
  api.use(adminRouter);
  api.use(googleAuthRouter);

  app.use("/api", api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = buildApp;
