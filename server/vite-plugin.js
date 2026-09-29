import { loadEnv } from 'vite';
import { openLocalDatabase } from './local-db.js';
import { apiMiddleware } from './node-adapter.js';
export function bookingApi() {
  return {
    name: 'nova-dent-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '');
      const DB = openLocalDatabase(env.DATABASE_PATH || undefined);
      server.middlewares.use(apiMiddleware({ DB, ADMIN_API_TOKEN: env.ADMIN_API_TOKEN }));
      server.httpServer?.once('close', () => DB.close());
    },
  };
}