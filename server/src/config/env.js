import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const DEV_SECRET = 'dev-only-secret-change-me';

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || DEV_SECRET,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  isProd: process.env.NODE_ENV === 'production',
};

if (env.isProd && env.jwtSecret === DEV_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}
