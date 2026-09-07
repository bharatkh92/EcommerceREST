import express from 'express';
import { pool, query } from '../config/db.js';

export const ordersRouter = express.Router();

ordersRouter.get('/', async(req, res, next) => {
    try {
        let sql = `SELECT o.id, o.total_price, o.order_date, o.status, o.shipping_address FROM orders o WHERE o.user_id = $1`;
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
        let sql = `SELECT * FROM order_details od
                    JOIN products p
                    ON p.id = od.product_id
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
    const client = await pool.connect();
    try {
        const { address_id } = req.body;
        await client.query('BEGIN');
        const cartTotalSql = `SELECT SUM(c.quantity * p.price) as cart_total
                            FROM cart c
                            JOIN products p
                            ON c.product_id = p.id
                            WHERE c.user_id = $1`;
        const cartTotalResult = await client.query(cartTotalSql, [req.user.id]);
        if (cartTotalResult.rows[0].cart_total <= 0) {
            return res.status(400).json({message: "cart is empty"});
        }
        const getAddressSql = `SELECT title, address_line_1
                                FROM addresses
                                WHERE id = $1`;
        const getAddressResult = await client.query(getAddressSql, [address_id]);
        const addressString = `${getAddressResult.rows[0].title}, ${getAddressResult.rows[0].address_line_1}`;
        const ordersSql = `INSERT INTO orders (user_id, total_price, shipping_address) 
                    VALUES ($1, $2, $3) 
                    RETURNING *`;
        const ordersResult = await client.query(ordersSql, [req.user.id, cartTotalResult.rows[0].cart_total, addressString]);
        const newOrderId = ordersResult.rows[0].id;
        const sql2 = `INSERT INTO order_details (order_id, product_id, quantity, at_price)
                    SELECT $1, c.product_id, c.quantity, p.price
                    FROM cart c
                    JOIN products p
                    ON c.product_id = p.id
                    WHERE c.user_id = $2 
                    RETURNING *`;
        const orderDetailsResult = await client.query(sql2, [newOrderId, req.user.id]);
        const cartClearSql = `DELETE FROM cart
                            WHERE user_id = $1
                            RETURNING *`;
        const cartClearResult = await query(cartClearSql, [req.user.id]);
        if (orderDetailsResult && cartClearResult) {
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

