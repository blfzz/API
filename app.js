const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const path = require('path');
const database = require('./src/config/database');
const { options, pool } = require('./src/config/database');
const authRouter = require('./src/routers/auth_router');
const flash = require('connect-flash');
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');

//template engine settings
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, './src/views'));
app.use(expressLayouts);


//sesion settings
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }))


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', authRouter);
app.use(flash());






app.listen(process.env.PORT, () => {
    console.log(`connected to port: ${process.env.PORT}`);
}) 