import dotenv from 'dotenv';
import path from 'path';

// Load .env.test before any test — points DATABASE_URL to local Postgres
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });
