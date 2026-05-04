const Redis = require('ioredis');

let client;
function getRedis() {
  if (client) return client;
  if (!process.env.REDIS_URL) {
    console.warn('[redis] REDIS_URL not set — running without cache');
    return null;
  }
  client = new Redis(process.env.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 });
  client.on('error', (err) => console.error('[redis]', err.message));
  return client;
}

module.exports = { getRedis };
