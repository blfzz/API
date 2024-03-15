const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const { pool } = require('../config/database');
const session = require('express-session');


const index = (req, res) => {
    let counter = 0
    // counter++
    console.log(req.session);

    if (req.session.counter) {
        req.session.counter++;

    } else {
        req.session.counter = 1;
    }
    res.json({ message: 'salam', counter: req.session.counter })
};



const registerGet = (req, res) => {

    res.status(200).render('register', { layout: './layout/main' });
}

const registerPost = async (req, res) => {

    try {

        await pool.query('SELECT email, isEmailActive, username FROM users WHERE email = ? OR username = ?', [req.body.email, req.body.username], async (error, results) => {

            // if the email or username already registered and verified
            if (results[0] && results[0].isEmailActive == true) {
                return res.json({ message: 'username or email address is already exists' });
            }

            // if the email already registered but not verified
            else if ((results[0] && results[0].isEmailActive == false) || (results[0] == undefined || null)) {

                //if the email is registered and not verified, delete it
                if (results[0]) {
                    await pool.query('DELETE FROM users WHERE email = ?', [results[0].email], (error, results) => { });
                }

                const newUser = ({
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    email: req.body.email,
                    username: req.body.username,
                    password: await bcrypt.hash(req.body.password, 10), // 10 = cost factor
                    isAdmin: false,
                    isEmailActive: false
                });

                pool.query('INSERT INTO users SET ?', [newUser], (error, results) => { });

                // email sending process
                const userDetail = {
                    email: newUser.email,
                    username: newUser.username
                };

                //generate expired token with userDetail
                const generateEmailToken = jwt.sign(userDetail, process.env.VERIFY_EMAIL_TOKEN_JWT_SECRET, { expiresIn: '2m' });

                //confirmation link
                const url = process.env.WEBSITE_URL + 'verify?id=' + generateEmailToken;

                //gmail service credential and create transport
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_USER,
                        pass: process.env.GMAIL_PASSWORD
                    }
                });

                //info
                const mailInfo = {
                    from: 'Nodejs_API <info@abulfaz.com',
                    to: userDetail.email,
                    subject: "Please confirm your email",
                    html: "<b><h3>Confirmation link: </h3></b>" + url
                };

                //sent email to receiver
                await transporter.sendMail(mailInfo, (error, info) => {

                    // res.json({ message: 'please confirm your email for login' });
                    res.redirect('/login');
                    transporter.close();
                })




            } // end of else if

            pool.on('release', (connection) => {
                console.log('Connection %d released', connection.threadId);
            });
        }); // end of pool.query

    } catch (error) {
        console.log(error);

    }

};


const loginGet = (req, res) => {
    res.render('login', { layout: './layout/main' });
}

const loginPost = async (req, res) => {

    try {
        //password call from database when user entered username and password
        pool.query('SELECT password, id, username, email, isEmailActive FROM users WHERE email = ?', [req.body.email], async (error, results) => {

            // req.session.email = req.body.email;
            // req.session.save();

            if (results.length === 0) {
                const dummyPassword = process.env.DUMMY_PASSWORD;
                const isPasswordMatch = await bcrypt.compare(req.body.password, dummyPassword);
                return res.json({ error: 'incorrect username or password' });
            }

            const hashedPassword = results[0].password;
            const checkPassword = await bcrypt.compare(req.body.password, hashedPassword);
            if (checkPassword == true) {

                if ((results[0] && results[0].isEmailActive == false)) {
                    return res.json({ message: 'email not verified, please confirm your email' });
                };

                const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
                const hashedOtp = await bcrypt.hash(otp, 10);

                const newOtpVerification = await {
                    // email: results[0].email,
                    hashedOtp: hashedOtp,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 120000 * 100000
                };




                // const SaveOtpToDB = pool.query('UPDATE otps SET hashedOtp = ? WHERE email = ?', [newOtpVerification, results[0].email], (error, results) => { });
                // const SaveOtpToDB = pool.query('UPDATE otps SET hashedOtp= ?, createdAt= ?, expiresAt= ? WHERE email= ?', [newOtpVerification.otp, newOtpVerification.createdAt, newOtpVerification.expiresAt, results[0].email], (error, results) => { console.log(results);});
                pool.query('INSERT INTO otps SET ?', [newOtpVerification], (error, results) => { 
                    console.log(error);
                    console.log(results);
                });

                //gmail service credential and create transport
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_USER,
                        pass: process.env.GMAIL_PASSWORD
                    }
                });

                //info
                const mailInfo = {
                    from: 'Nodejs_API <info@abulfaz.com',
                    to: results[0].email,
                    subject: "ONE TIME PASSWORD",
                    html: `<p>OTP verification code: </p><h1><b>${otp}</b></h1><br><h2>This OTP expires in 2 minutes</h2>`
                };

                //sent email to receiver
                await transporter.sendMail(mailInfo, (error, info) => { transporter.close(); });

                // return res.json({ message: 'verification otp email sent ' });
                // res.json({ message: 'OTP send successfully to your email, please enter the OTP code to login' });
                res.redirect('/otp');

            } else {
                return res.json({ error: 'incorrect username or password' });
            }
        });

    } catch (error) {
    }
    pool.on('release', (connection) => {
        console.log('Connection %d released', connection.threadId);
    });
};


const refresh = (req, res) => {

    const { refreshToken } = req.body;

    try {

        //verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY);
        const { id, username } = decoded

        //generate new access token
        const accessToken = jwt.sign({
            id: id,
            username: username
        }, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: '1m' })

        return res.json({ message: 'token successfully refreshed', refreshToken: refreshToken, newAccessToken: accessToken })

    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return res.json({ message: 'token expired, please relogin' });
        } else if (error.name === "JsonWebTokenError") {
            return res.json({ message: 'invalid token' });
        } else {
            return res.json({ message: 'unauthorized' });
        }

    }

};


const verifyGet = (req, res) => {

    const token = req.query.id;
    if (token) {

        try {

            jwt.verify(token, process.env.VERIFY_EMAIL_TOKEN_JWT_SECRET, async (error, decoded) => {

                if (error) {
                    res.json({ error: 'token expired or incorrect' });
                } else {
                    const decodedEmailValue = decoded.email
                    const emailActiveTrue = await pool.query('UPDATE users SET isEmailActive = true WHERE email = ?', [decodedEmailValue], (error, results) => { });
                    if (emailActiveTrue) {
                        res.json({ message: 'email has been successfully verified' });
                    } else {
                        res.json({ message: 'please register again' });
                    }
                    pool.on('release', (connection) => {
                        console.log('Connection %d released', connection.threadId);
                    });
                }

            });



        } catch (error) {

        }
    } else {
        return res.json({ message: 'invalid token' });
    }

};


const verifyPost = async (req, res) => {
    try {


        if (!req.body.email || !req.body.otp) {
            res.json({ message: 'empty otp do not allowed' })
        } else {

            //email and otp send to /verify
            await pool.query('SELECT email, otp FROM users WHERE email = ?', [req.body.email], async (error, results) => {


                console.log(results);

                if (results.length <= 0) {
                    res.json({ message: 'account does not exists or verified' });

                } else {


                    const { expiresAt } = JSON.parse(results[0].otp);
                    const { otp } = JSON.parse(results[0].otp);
                    const hashedOtp = otp;

                    if (expiresAt < Date.now()) {
                        await pool.query('UPDATE otps SET OTP = 0 WHERE email = ?', [results[0].email], (error, results) => { });
                        res.json({ message: 'OTP code has expired. Please request again' });
                    } else {

                        const validOtp = await bcrypt.compare(req.body.otp, hashedOtp)
                        if (!validOtp) {
                            res.json({ message: 'invalid OTP code' })
                        } else {
                            const accessToken = jwt.sign({
                                email: results[0].email
                            }, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: '1m' })

                            const refreshToken = jwt.sign({
                                email: results[0].email
                            }, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: '5m' })

                            return res.json({ message: 'otp is true, user login successfully', accessToken: accessToken, refreshToken: refreshToken });

                        }
                    }

                }

            });



        }

    } catch (error) {
        // console.log(error);

    }
};


const otpGet = (req, res) => {
    res.render('otp', { layout: './layout/main' });
}


module.exports = {
    registerGet,
    registerPost,
    loginGet,
    loginPost,
    refresh,
    verifyGet,
    verifyPost,
    otpGet,
    index
}