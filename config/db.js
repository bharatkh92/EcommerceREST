import { Pool } from "pg";
import 'dotenv/config';

export const pool = new Pool({
    user: process.env.DB_user,
    password: process.env.DB_password,
    host: process.env.DB_host,
    port: process.env.DB_port,
    database: process.env.DB_name
});

export const query = (text, params) => {
    return pool.query(text, params);
}