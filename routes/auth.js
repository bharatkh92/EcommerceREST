import express from 'express';
import passport from 'passport';

export const authRouter = express.Router();

authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email']})); 

authRouter.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
});

authRouter.post('/logout', (req, res, next) => {
    req.logout((error) => {
        if (error) {
            return next(error);
        }

    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to destroy session'});
        }

        res.clearCookie('connect.sid');
        res.status(200).json({message: 'Successfully logged out'});
    })

    })
})