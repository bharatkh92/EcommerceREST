import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import 'dotenv/config';
import { query } from './db.js';
import { pool } from './db.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
    }, async ( accessToken, refreshToken, profile, done ) => {
        const checkExistingUser = `SELECT * FROM users u JOIN user_identities ui ON u.id = ui.user_id WHERE ui.provider_name = 'google' AND ui.provider_account_id = $1`;
        try {
            const doesUserExist = await query(checkExistingUser, [profile.id]);
            if (doesUserExist.rows.length > 0 ) {
                return done(null, doesUserExist.rows[0]);
            } 
            // if the user does not exist create user
            const client = await pool.connect();

            try {
                await client.query('BEGIN');
                // inserting into users table
                const insertUserInUsersTable = `INSERT INTO users (name, email) 
                    VALUES ($1, $2) RETURNING id, name, email`;
                const email = profile.emails[0].value;
                const newUserResult = await client.query(insertUserInUsersTable, [profile.displayName, email]);
                const newUser = newUserResult.rows[0];
                // inserting into user_identities table
                const insertUserInIdentities = `INSERT INTO user_identities (user_id, provider_name, 
                    provider_account_id, access_token, access_token_expires_at, refresh_token) VALUES (
                    $1, 'google', $2, $3, CURRENT_TIMESTAMP + INTERVAL '1 hour', $4)`;
                await client.query(insertUserInIdentities, [newUser.id, profile.id, accessToken, refreshToken]);

                await client.query('COMMIT');
                return done(null, newUser);

            } catch (transactionError) {
                await client.query('ROLLBACK');
                console.error(`error during user insertion:`, transactionError);
                throw transactionError;
            } finally {
                client.release();
            }

        } catch(err) {
            console.error(`Error during checking existing user:`, err);
            return done(err, null);
        }

    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser(async (id, done) => {
    const getUserQuery = `SELECT id, name, email, role FROM users WHERE id = $1`;
    try {
        const result = await query(getUserQuery, [id]);
        if (result.rows.length > 0) {
            done(null, result.rows[0]);
        } else {
            done(null, false);
        }
    } catch(err) {
        console.error(`Error during deserializeuser: `, err);
        done(err, null);
    }
})
