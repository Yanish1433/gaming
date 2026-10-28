import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { env } from './env.js';

const PLACEHOLDER = 'PASTE_YOUR_ATLAS_URI_HERE';
const LOCAL_PORT = 27018;
const LOCAL_DB_NAME = 'arena';
export const LOCAL_DB_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.data/db');

let embedded = null; // the MongoMemoryServer this process started, if any

export const usesLocalDb = (uri = env.mongoUri) => !uri || uri.trim() === PLACEHOLDER;

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

// Persistent embedded MongoDB at server/.data/db, so the site runs with zero setup.
// If another process (e.g. `npm run dev` while you run `npm run seed`) already serves it, reuse that one.
async function localUri() {
  console.log('Using local dev database (server/.data). Set MONGODB_URI in server/.env to use Atlas.');
  if (!(await portInUse(LOCAL_PORT))) {
    // Imported lazily so Atlas deployments never load it.
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    fs.mkdirSync(LOCAL_DB_PATH, { recursive: true });
    embedded = await MongoMemoryServer.create({
      instance: { dbPath: LOCAL_DB_PATH, port: LOCAL_PORT, storageEngine: 'wiredTiger', ip: '127.0.0.1' },
    });
  }
  return `mongodb://127.0.0.1:${LOCAL_PORT}/${LOCAL_DB_NAME}`;
}

export async function connectDB(uri = env.mongoUri) {
  const target = usesLocalDb(uri) ? await localUri() : uri;
  mongoose.set('strictQuery', true);
  await mongoose.connect(target);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
}

// Closes the connection and, if this process started the embedded DB, shuts it down cleanly (data is kept).
export async function disconnectDB() {
  if (embedded) {
    // On Windows the library can only hard-kill a standalone mongod, so ask it to shut down cleanly first.
    try {
      await mongoose.connection.db.admin().command({ shutdown: 1, timeoutSecs: 5 });
    } catch {
      // The connection drops as mongod exits; that's expected.
    }
  }
  await mongoose.disconnect();
  if (embedded) {
    await embedded.stop({ doCleanup: false, force: false });
    embedded = null;
  }
}
