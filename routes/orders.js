import express from 'express';
import { query } from '../config/db.js';

export const ordersRouter = express.Router();

ordersRouter.get('/', async(req, res, next) => {
    try {
        let sql = `SELECT o.id, o.total_price, o.order_date, o.status, a.address_line_1 FROM orders o JOIN addresses a ON o.shipping_address_id = a.id WHERE o.user_id = $1`;
        let results = await query(sql, [req.user.id]);
        if (results) {
            return res.status(200).json(results.rows);
        }    
    } catch(error) {
        error.message = 'Error while getting orders';
        next(error);
    }
})