import { env } from './config/env.js';
import { connectDB, disconnectDB, usesLocalDb } from './config/db.js';
import { createApp } from './app.js';
import { User } from './models/index.js';
import { seed } from './seed/seed.js';

try {
  await connectDB();
  // Zero-setup dev: an empty local database gets demo data on first start. Atlas is never auto-seeded.
  // (A real lookup, not estimatedDocumentCount: cached counts can read 0 after an unclean stop.)
  if (usesLocalDb() && !(await User.exists({}))) {
    console.log('Local database is empty, seeding demo data...');
    await seed();
  }
  const server = createApp().listen(env.port, () => console.log(`Arena Nepal API on http://localhost:${env.port}`));

  // Shut the embedded DB down cleanly so its data files stay consistent.
  const shutdown = async () => {
    server.close();
    await disconnectDB().catch(() => {});
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch (err) {
  console.error('Failed to start:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
}
