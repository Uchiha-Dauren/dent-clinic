import { it, expect } from 'vitest';
import { createServer, request as httpRequest } from 'node:http';
import { openLocalDatabase } from '../../../Downloads/nova-dent/server/local-db.js';
import { apiMiddleware } from '../../../Downloads/nova-dent/server/node-adapter.js';
import { addDays, zonedNow } from '../../../Downloads/nova-dent/src/lib/time.js';
it('serves real HTTP requests through the Node adapter', async () => {
  const DB = openLocalDatabase(':memory:');
  const token = 'integration-test-token-'.repeat(3);
  const middleware = apiMiddleware({ DB, ADMIN_API_TOKEN: token });
  const server = createServer((req, res) =>
    middleware(req, res, () => {
      res.writeHead(404);
      res.end();
    }),
  );
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  function call(path, method = 'GET', data, authorized = false) {
    return new Promise((resolve, reject) => {
      const req = httpRequest(
        {
          hostname: '127.0.0.1',
          port: server.address().port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID(),
            ...(authorized ? { Authorization: 'Bearer ' + token } : {}),
          },
        },
        (res) => {
          let text = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (text += chunk));
          res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(text) }));
        },
      );
      req.on('error', reject);
      req.end(data ? JSON.stringify(data) : undefined);
    });
  }
  try {
    expect((await call('/api/health')).status).toBe(200);
    const saved = await call('/api/bookings', 'POST', {
      name: 'Сынақ',
      phone: '+77010000000',
      date: addDays(zonedNow().date, 1),
      time: 'any',
      comment: '',
      consent: true,
      lang: 'kk',
    });
    expect(saved.status).toBe(201);
    expect((await call('/api/bookings')).status).toBe(401);
    const listed = await call('/api/bookings', 'GET', undefined, true);
    expect(listed.json.bookings[0].id).toBe(saved.json.id);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    DB.close();
  }
});
