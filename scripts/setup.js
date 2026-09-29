import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (!existsSync('.env')) {
  writeFileSync(
    '.env',
    readFileSync('.env.example', 'utf8').replace(
      'ADMIN_API_TOKEN=',
      'ADMIN_API_TOKEN=' + randomBytes(32).toString('hex'),
    ),
    { mode: 0o600, flag: 'wx' },
  );
  console.log('Created .env with a private admin token. Keep this file private.');
} else console.log('.env already exists; left unchanged.');
