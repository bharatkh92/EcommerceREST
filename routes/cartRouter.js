import express, { response } from 'express';
import { query } from '../config/db.js';

export const cartRouter = express.Router();

cartRouter.get('/', async(req, res, next) => {
    try {
        const sql = `SELECT p.id , p.name, p.description, p.price, p.image, p.price, p.weight, c.quantity, c.created_at 
                FROM cart c 
                JOIN products p 
                ON c.product_id = p.id 
                WHERE user_id = $1`;
        const results = await query(sql, [req.user.id]);
        const cartTotalSql = `SELECT SUM(c.quantity * p.price) as cart_total
                            FROM cart c
                            JOIN products p
                            ON c.product_id = p.id
                            WHERE c.user_id = $1`;
        const cartTotalResult = await query(cartTotalSql, [req.user.id]);
        if (results && cartTotalResult) {
            return res.status(200).json({
                cart: results.rows,
                cartTotal: cartTotalResult.rows[0].cart_total
            });
        }
    } catch(error) {
        error.message = 'Error while fetching cart';
        next(error)
    }
})

cartRouter.post('/', async(req, res, next) => {
    try {
        const { product_id, quantity } = req.body;
        const sql = `INSERT INTO cart(user_id, product_id, quantity)
                VALUES ($1, $2, $3)
                RETURNING *`;

        const results = await query(sql, [req.user.id, product_id, quantity]);
        if (results) {
            return res.status(201).json(results.rows);
        }
    } catch(error) {
        error.message = 'Error while adding to the cart';
        next(error)
    }
})

cartRouter.put('/', async(req, res, next) => {
    try {
        const { product_id, quantity } = req.body;
        const sql = `UPDATE cart
                   SET quantity = $1
                   WHERE product_id = $2
                   AND user_id = $3
                   RETURNING *`;
        const results = await query(sql, [quantity, product_id, req.user.id]);
        if (results) {
            return res.status(201).json(results.rows);
        }
    } catch(error) {
        error.message = 'Error while updating the cart';
        next(error)
    }
})

cartRouter.delete('/:product_id', async(req, res, next) => {
    try {
        const product_id = parseInt(req.params.product_id);
        const sql = `DELETE FROM cart
                    WHERE user_id = $1
                    AND product_id = $2
                    RETURNING *`;
        const results = await query(sql, [req.user.id, product_id]);
        if (results) {
            return res.status(200).json(results.rows);
        }

    } catch(error) {
        error.message = 'Error while deleting the cart';
        next(error)
    }
})

cartRouter.delete('/', async(req, res, next) => {
    try {
        const sql = `DELETE FROM cart
                    WHERE user_id = $1
                    RETURNING *`;
        const results = await query(sql, [req.user.id]);
        if (results) {
            return res.status(200).json(results.rows);
        }

    } catch(error) {
        error.message = 'Error while deleting the cart';
        next(error)
    }
})