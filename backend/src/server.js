const mongoose = require('mongoose');
const { createApp } = require('./app');
const { connectDatabase } = require('./config/db');
const { getEnv } = require('./config/env');

async function startServer() {
  const env = getEnv();
  await connectDatabase(env.MONGODB_URI);

  const app = createApp({ clientOrigin: env.CLIENT_ORIGIN });
  const server = app.listen(env.PORT, () => {
    console.log(`KEETY API listening on port ${env.PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((error) => {
  console.error(`KEETY API failed to start: ${error.message}`);
  process.exit(1);
});