import express from 'express';
import { query } from '../config/db.js';

export const userRouter = express.Router();

userRouter.get('/profile', async(req, res, next) => {
    try {
        let userSql = `SELECT id, name, email, created_at FROM users WHERE id = $1`;
        let userResult = await query(userSql, [req.user.id]);
        if (userResult) {
            return res.status(200).json(userResult.rows);
        }
        
    } catch(error) {
        error.message = 'Error while fetching profile';
        next(error);
    }
    
})

userRouter.get('/addresses', async(req, res, next) => {
    try {
        let addressSql = `SELECT * FROM addresses WHERE user_id = $1`;
        let addressResult = await query(addressSql, [req.user.id]);
        if (addressResult) {
            return res.status(200).json(addressResult.rows);
        }
    } catch(error) {
        error.message = `Error while fetching addresses`;
        next(error);
    }
})

userRouter.post('/addresses', async(req, res, next) => {
    try {
        let {title, address_line_1, address_line_2, city, state, postal_code, country } = req.body;
        let addressSql = `INSERT INTO addresses(user_id, title, address_line_1, address_line_2, city, state, postal_code, country)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            RETURNING *`;
        let addressResult = await query(addressSql, [req.user.id, title || null, address_line_1, address_line_2 || null,
                                         city, state, postal_code, country]);
        if (addressResult) {
            return res.status(201).json(addressResult.rows);
        }
    } catch(error) {
        error.message = `Error while adding the address`;
        next(error);
    }
})

userRouter.put('/addresses/:addressId', async(req, res, next) => {
    try {
        let addressId = req.params.addressId;
        let { title, address_line_1, address_line_2, city, state, postal_code, country } = req.body;
        let addressSql = `UPDATE addresses 
                            SET title = $1, 
                                address_line_1 = $2,
                                address_line_2 = $3,
                                city = $4,
                                state = $5,
                                postal_code = $6,
                                country = $7
                            WHERE user_id = $8
                                AND id = $9
                            RETURNING *`;
        let addressResult = await query(addressSql, [title, 
                                                        address_line_1,
                                                        address_line_2,
                                                        city,
                                                        state,
                                                        postal_code,
                                                        country,
                                                        req.user.id,
                                                        addressId]);
        if (addressResult) {
            return res.status(201).json(addressResult.rows);
        }
                                        
    } catch(error) {
        error.message = `Error while editing the address`;
        next(error);
    }
})

userRouter.delete('/addresses/:addressID', async(req, res, next) => {
    try {
        let { address_id } = req.params.addressID;
        let addressSql = `DELETE FROM addresses 
                            WHERE id = $1
                                AND user_id = $2
                                RETURNING *`;
        let addressResults = await query(addressSql, [address_id, req.user.id]);
        if (addressResults) {
            return res.status(200).json(addressResults.rows);
        }
    } catch(error) {
        error.message = `Error while deleting the address`;
        next(error);
    }
})