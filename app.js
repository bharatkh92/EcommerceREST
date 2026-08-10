import express from 'express';
import 'dotenv/config';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import passport from 'passport';
import './config/passport.js';
import cors from 'cors';
import { query, pool} from './config/db.js';
import { authRouter } from './routes/auth.js';

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

app.use('/auth', authRouter);

app.get('/', async (req, res) => {
  // res.send('Hello World!');
  let sql = "select 'dataabase is connected' as status";
  let result = await query(sql,[]);
  if (result) {
    console.log(`user name is ${req.user.name} id is ${req.user.id} email is ${req.user.email} role is ${req.user.role}`);
    res.status(200).send(result.rows[0].status);
  } else {
    console.log('outside if');
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});