import express from 'express';
import { query } from '../config/db.js';

export const productsRouter = express.Router();

productsRouter.get('/', async (req, res, next) => {
    try {
        let sql = `SELECT * FROM products`;
        let results = await query(sql, []);
        if (results) {
            return res.status(200).json(results.rows);
        }
    } catch(error) {
        error.message = 'Error while getting products';
        next(error);
    }
})

productsRouter.get('/:productId', async (req, res, next) => {
    try {
        let sql = `SELECT * 
                    FROM products
                    WHERE id = $1`; 
        let results = await query(sql, [req.params.productId]);
        if (results) {
            return res.status(200).json(results.rows);
        }
    } catch(error) {
        error.message = 'Cannot get the product';
        next(error);
    }
})

productsRouter.get('/categories', async (req, res, next) => {
    try {
        let sql = `SELECT * FROM categories`;
        let results = await query(sql, []);
        if (results) {
            return res.status(200).json(results.rows);
        }
    } catch(error) {
        error.message = 'Error while getting categores';
        next(error);
    }
})

productsRouter.get('/categories/:categoryId', async (req, res, next) => {
    
    try{
        let sql = `SELECT * FROM products p 
        JOIN product_categories pc
        ON p.id = pc.product_id
        JOIN categories c
        ON pc.category_id = c.id 
        WHERE c.id = $1;`;
        let results = await query(sql, [Number(req.params.categoryId)]);
        if(results) {
            return res.status(200).json(results.rows);
        }
    } catch(error) {
        error.message = 'Error while getting products from the category';
        next(error);
    }     
})