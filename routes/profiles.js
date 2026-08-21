import express from 'express';
import { query } from '../config/db.js';

export const profileRouter = express.Router();

profileRouter.get('/', async(req, res, next) => {
    try {
        let userSql = `SELECT id, name, email, created_at FROM users WHERE id = $1`;
        let addressSql = `SELECT * FROM addresses WHERE user_id = $1`;
        let userResult = await query(userSql, [req.user.id]);
        let addressResult = await query(addressSql, [req.user.id]);
        return res.send([userResult.rows, addressResult.rows]);

    } catch(error) {
        error.message = 'Error while fetching profile';
        next(error);
    }

})