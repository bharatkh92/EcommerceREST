import express from 'express';
import 'dotenv/config';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import passport from 'passport';
import './config/passport.js';
import cors from 'cors';
import { query, pool} from './config/db.js';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/productsRouter.js';
import { cartRouter } from './routes/cartRouter.js';
import { ordersRouter } from './routes/ordersRouter.js';
import { ensureAuthenticated } from './middleware/authMiddleware.js';
import { userRouter } from './routes/userRouter.js';

const app = express();
const port = 3000;

// connect-pg-simple initialisation 
const PostgresqlStore = pgSession(session);

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true 
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use(session({
    store: new PostgresqlStore({
        pool: pool, 
        tableName: 'session' 
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 30 
    }
}));


app.use(passport.initialize());
app.use(passport.session());

// assign routers here
app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/cart', ensureAuthenticated, cartRouter);
app.use('/orders', ensureAuthenticated, ordersRouter);
app.use('/user', ensureAuthenticated, userRouter);

app.get('/', async (req, res) => {
  // res.send('Hello World!');
  let sql = "select 'dataabase is connected' as status";
  let result = await query(sql,[]);
  try {
    if (result) {
      console.log(`user name is ${req.user.name} id is ${req.user.id} email is ${req.user.email} role is ${req.user.role}`);
      res.status(200).json({result: result.rows[0].status, message: `user name is ${req.user.name} id is ${req.user.id} email is ${req.user.email} role is ${req.user.role}`});
    }

  }catch(e) {
    console.log('outside if');
    res.status(500).send('log in ')
  }
});

app.use((error, req, res, next) => {
  console.error('Internal Server Error: ', error);
  const message = error.message || 'Something Went Wrong';

  return res.status(500).json({error: 'Internal Server Error', message: message});
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});