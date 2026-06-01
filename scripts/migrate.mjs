import { spawnSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const rootDir = process.cwd();
const envPath = resolve(rootDir, '.env');

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const fileEnv = parseEnvFile(envPath);
const databaseUrl = process.env.DATABASE_URL ?? fileEnv.DATABASE_URL;

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL not found in environment or .env file');
  process.exit(1);
}

const commands = {
  up:       ['up'],
  down:     ['down', '1'],
  'down:all': ['down', '-all'],
};

const cmd = process.argv[2] ?? 'up';
const migrateArgs = commands[cmd];

if (!migrateArgs) {
  console.error(`ERROR: unknown command "${cmd}". Valid: up, down, down:all`);
  process.exit(1);
}

const result = spawnSync(
  'go',
  [
    'run', '-tags', 'postgres',
    'github.com/golang-migrate/migrate/v4/cmd/migrate',
    '-path', './db/migrations',
    '-database', databaseUrl,
    ...migrateArgs,
  ],
  {
    cwd: resolve(rootDir, 'apps/backend'),
    stdio: 'inherit',
  }
);

process.exit(result.status ?? 1);
