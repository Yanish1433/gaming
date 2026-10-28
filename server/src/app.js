import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { errorHandler, notFound } from './middleware/error.js';
import { maintenanceGuard } from './middleware/maintenance.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  // Uploaded images are loaded cross-origin by the Vite dev client.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.clientOrigin.split(',').map((o) => o.trim()), credentials: true }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));
  app.use(express.json({ limit: '100kb' }));

  app.use(
    '/uploads',
    express.static(UPLOAD_DIR, {
      index: false,
      dotfiles: 'deny',
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  );
  app.use('/api', maintenanceGuard, routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
