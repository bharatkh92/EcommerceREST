import express from 'express';
import { query } from '../config/db.js';

export const productsRouter = express.Router();

productsRouter.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = ((page - 1) * limit);
        const categoryId = parseInt(req.query.category);

        if (categoryId) {
            const countSql = `SELECT COUNT(*) FROM product_categories 
                                WHERE category_id = $1`;
            const countResult = await query(countSql, [categoryId]);
            const totalCategoryProductsCount = countResult.rows[0].count;
            const productsSql = `SELECT * FROM 
                                    products p
                                    JOIN product_categories pc
                                    ON pc.product_id = p.id
                                    WHERE pc.category_id = $1
                                    ORDER BY id ASC
                                    LIMIT $2
                                    OFFSET $3`;
            const categoryProductsResult = await query(productsSql, [categoryId, limit, offset]);
            if (categoryProductsResult) {
                return res.status(200).json({
                    products: categoryProductsResult.rows,
                    totalPages: Math.ceil(totalCategoryProductsCount / limit),
                    currentPage: page,
                })
            }
        }
        const countSql = `SELECT COUNT(*) FROM products`;
        const countResult = await query(countSql);
        const totalCount = countResult.rows[0].count;

        const productsSql = `SELECT * FROM 
                                products
                                ORDER BY id ASC
                                LIMIT $1
                                OFFSET $2`;
        const productsResult = await query(productsSql, [limit, offset]);
        if (productsResult) {
            return res.status(200).json({
                products: productsResult.rows,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
            });
        }
    } catch(error) {
        error.message = 'Error while getting products';
        next(error);
    }
})

productsRouter.get('/product/:productId', async (req, res, next) => {
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