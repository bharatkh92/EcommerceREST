import express from 'express';
import { pool, query } from '../config/db.js';

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

ordersRouter.get('/:orderId', async(req, res, next) => {
    try {
        let orderId = req.params.orderId;
        let sql = `SELECT * FROM order_details
                    WHERE order_id = $1`;
        let result = await query(sql, [orderId]);
        if (result) {
            return res.status(200).json(result.rows)
        }
    } catch(error) {
        error.message = `Error while getting order details`;
        next(error);
    }
})

ordersRouter.delete('/:orderId', async(req, res, next) => {
    try {
        let orderId = req.params.orderId;
        let sql = `DELETE FROM orders 
                    WHERE id = $1
                    RETURNING *`;
        let result = await query(sql, [orderId]);
        if (result) {
            return res.status(200).json(result.rows)
        }
    } catch(error) {
        error.message = `Error while deleting order`;
        next(error);
    }
})

ordersRouter.post('/', async (req, res, next) => {
    let client = await pool.connect();
    try {
        let { address_id } = req.body;
        await client.query('BEGIN');
        let cartTotalSql = `SELECT SUM(c.quantity * p.price) as cart_total
                            FROM cart c
                            JOIN products p
                            ON c.product_id = p.id
                            WHERE c.user_id = $1`;
        let cartTotalResult = await client.query(cartTotalSql, [req.user.id]);
        let ordersSql = `INSERT INTO orders (user_id, total_price, shipping_address_id) 
                    VALUES ($1, $2, $3) 
                    RETURNING *`;
        let ordersResult = await client.query(ordersSql, [req.user.id, cartTotalResult.rows[0].cart_total, address_id]);
        let sql2 = `INSERT INTO order_details (order_id, product_id, quantity, at_price)
                    SELECT $1, c.product_id, c.quantity, p.price
                    FROM cart c
                    JOIN products p
                    ON c.product_id = p.id
                    WHERE c.user_id = $2 
                    RETURNING *`;
        let newOrderId = ordersResult.rows[0].id;
        let orderDetailsResult = await client.query(sql2, [newOrderId, req.user.id]);
        if (orderDetailsResult) {
            await client.query('COMMIT');
            return res.status(201).json(orderDetailsResult.rows);
        }
        
        } catch(error) {
        await client.query('ROLLBACK');
        error.message = 'Error while adding order';
        next(error);
    } finally {
        client.release();
    }
})

