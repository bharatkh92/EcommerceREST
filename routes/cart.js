import express, { response } from 'express';
import { query } from '../config/db.js';

export const cartRouter = express.Router();

cartRouter.get('/', async(req, res, next) => {
    try {
        let sql = `SELECT p.id, p.name, p.description, p.price, p.image, p.price, p.weight, c.quantity, c.created_at 
                FROM cart c 
                JOIN products p 
                ON c.product_id = p.id 
                WHERE user_id = $1`;
        let results = await query(sql, [req.user.id]);
        if (results) {
            return res.status(200).json(results.rows);
        }
    } catch(error) {
        error.message = 'Error while fetching cart';
        next(error)
    }
})

cartRouter.post('/', async(req, res, next) => {
    try {
        const { product_id, quantity } = req.body;
        let sql = `INSERT INTO cart(user_id, product_id, quantity)
                VALUES ($1, $2, $3)
                RETURNING *`;

        let results = await query(sql, [req.user.id, product_id, quantity]);
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
        let sql = `UPDATE cart
                   SET quantity = $1
                   WHERE product_id = $2
                   AND user_id = $3
                   RETURNING *`
        let results = await query(sql, [quantity, product_id, req.user.id]);
        if (results) {
            return res.status(201).json(results.rows);
        }
    } catch(error) {
        error.message = 'Error while updating the cart';
        next(error)
    }
})

cartRouter.delete('/', async(req, res, next) => {
    try {
        const { product_id } = req.body;
        let sql = `DELETE FROM cart
                    WHERE user_id = $1
                    AND product_id = $2
                    RETURNING *`;
        let results = await query(sql, [req.user.id, product_id]);
        if (results) {
            return res.status(200).json(results.rows);
        }

    } catch(error) {
        error.message = 'Error while deleting the cart';
        next(error)
    }
})