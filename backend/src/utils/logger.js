function timestamp() {
  return new Date().toISOString();
}

module.exports = {
  info: (msg) => console.log(`${timestamp()} - INFO - ${msg}`),
  warning: (msg) => console.warn(`${timestamp()} - WARNING - ${msg}`),
  error: (msg) => console.error(`${timestamp()} - ERROR - ${msg}`),
};
