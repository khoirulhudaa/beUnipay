const Subscriber = require('../models/subscribeModel');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const subscribe = async (req, res) => {
    try {
        const { email_consumer } = req.body

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'muhammadkhoirulhuda111@gmail.com',
                pass: 'cbnq jjqg cggu jpxx'
            }
        })

        const cssPath = path.join(__dirname, '../styles/style.css');
        const cssStyles = fs.readFileSync(cssPath, 'utf8');
        
        const emailContent = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        ${cssStyles}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Welcome to ShopPay - New Subscriber!</h2>
                        <p>You are receiving this email because you (or someone else) has subscribed to our website. Thank you for joining our community of shoppers. To get started, please click the link below:</p>
                        <br>
                        <hr>
                        <br>
                        <p>If you didn't intend to subscribe, please ignore this email.</p>
                    </div>
                </body>
            </html>
        `;

        const mailOptions = {
            to: email_consumer,
            from: 'muhammadkhoirulhuda111@gmail.com',
            subject: 'Subscriber at ShopPay (You)',
            html: emailContent
        }

        transporter.sendMail(mailOptions, async (err) => {
            if(err) return res.json({ status: 500, message: 'Email sending failed!', error: err.message })
            
            const subscribe_id = crypto.randomBytes(20).toString('hex')

            const newSubscriber = new Subscriber({
                subscribe_id,
                email_consumer,
            })
            
            const subscribe = await newSubscriber.save()
            if(!subscribe) return res.json({ status: 200, message: 'Failed to subscribing!' })
            return res.json({ status: 200, message: 'Thank you for subscribing!' })
        })

    } catch (error) {
        return res.json({ status: 500, message: 'Server error!', error: error.message })
    }
}

module.exports = {
    subscribe
}