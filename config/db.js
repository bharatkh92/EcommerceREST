import { Pool } from "pg";
import 'dotenv/config';

export const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false, // Mandatory for connecting to Neon
    },
});

export const query = (text, params) => {
    return pool.query(text, params);
}