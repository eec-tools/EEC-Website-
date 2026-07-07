const config = require("./src/config/env");
const logger = require("./src/utils/logger");
const bootstrap = require("./src/bootstrap");
const buildApp = require("./src/app");

bootstrap()
  .then(() => {
    const app = buildApp();
    app.listen(config.port, () => {
      logger.info(`Elan Exports Consultancy API listening on port ${config.port}`);
    });
  })
  .catch((err) => {
    logger.error(`Fatal bootstrap error: ${err.stack || err}`);
    process.exit(1);
  });
