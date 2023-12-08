const multer = require('multer');
const Consumer = require('../models/consumerModel')
const Seller = require('../models/sellerModel')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const nodemailer = require('nodemailer')

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extname = path.extname(file.originalname);
        const originalFileName = file.originalname;
        const fileNameWithoutExtension = path.parse(originalFileName).name.split(' ').join('');

        cb(null, `${fileNameWithoutExtension}_${Date.now()}${extname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowExtensions = ['.jpg', '.jpeg', '.png'];
        const extname = path.extname(file.originalname);

        if (allowExtensions.includes(extname)) {
            cb(null, true);
        } else {
            const error = new Error('Hanya file dengan ekstensi jpg, jpeg, atau png yang diperbolehkan.');
            cb(error);
        }
    },
});

const signUpConsumer = async (req, res) => {
    try {
        const { email_consumer, consumer_name, gender, telephone_consumer, password } = req.body
       
        const equalConsumer = await Consumer.findOne({ email_consumer })
        if(equalConsumer) return res.json({ status: 400, message: 'Email already exist!' })
 
        function generateRandomString(length) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
          
            for (let i = 0; i < length; i++) {
              const randomIndex = Math.floor(Math.random() * characters.length);
              result += characters.charAt(randomIndex);
            }
          
            return result;
        }
          
        const randomString = generateRandomString(5);

        const salt = await bcrypt.genSalt(10)
        const passwordHashGenerate = await bcrypt.hash(password, salt)

        const newConsumer = new Consumer({
            consumer_name,
            email_consumer,
            password: passwordHashGenerate,
            gender,
            consumer_id: randomString,
            telephone_consumer
        })

        await newConsumer.save()
        return res.json({ status: 200, message: 'Success Register!' })

    } catch (error) {
        return res.json({ status: 500, message: 'Failed to signUp', error: error });
    }
}

const signInConsumer = async (req, res) => {
    try {
        const {email_consumer, password} = req.body
        const consumer = await Consumer.findOne({ email_consumer })
        if(!consumer) return res.json({ status: 404, message: 'User not found!' })

        const isMatch = await bcrypt.compare(password, consumer.password);

        if (!isMatch) {
            return res.json({ status: 401, message: 'Incorrect password' });
        }

        const token = jwt.sign({ consumer_id: consumer.consumer_id }, 'ElectShop', { expiresIn: '2h' });
        return res.json({ status: 200, token, data: consumer });
        
    } catch (error) {
        return res.json({ status: 500, message: 'Failed to signIn', error: error.message });
    }
} 

// Seller Authentication

const signUpSeller = async (req, res) => {
    try {
        const { email_seller, seller_name, gender, telephone_seller, password } = req.body

        const equalSeller = await Seller.findOne({ email_seller })
        if(equalSeller) return res.json({ status: 401, message: 'Email already exist!' })

        function generateRandomString(length) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
          
            for (let i = 0; i < length; i++) {
              const randomIndex = Math.floor(Math.random() * characters.length);
              result += characters.charAt(randomIndex);
            }
          
            return result;
        }
          
        const randomString = generateRandomString(5);

        const salt = await bcrypt.genSalt(10)
        const passwordHashGenerate = await bcrypt.hash(password, salt)

        const newSeller = new Seller({
            seller_name,
            email_seller,
            password: passwordHashGenerate,
            gender,
            seller_id: randomString,
            telephone_seller
        })

        const create = await newSeller.save()
        
        if(!create) return res.json({ status: 401, message: 'Failed create account seller!', data: req.body })
        return res.json({ status: 200, message: 'Successfully register!', data: req.body })

    } catch (error) {
        return res.json({ status: 500, message: 'Failed to signUp', error: error.message });
    }
}

// SignIn Account Seller

const signInSeller = async (req, res) => {
    try {
        const { email_seller, password } = req.body;

        if (!email_seller || !password) {
            return res.json({ status: 400, message: 'Invalid input' });
        }

        const seller = await Seller.findOne({ email_seller });
        if (!seller) {
            return res.json({ status: 404, message: 'Seller not found!' });
        }

        const isMatch = await bcrypt.compare(password, seller.password);
        if (!isMatch) {
            return res.json({ status: 401, message: 'Incorrect password' });
        }

        const token = jwt.sign({ seller_id: seller.seller_id }, 'ElectShop', { expiresIn: '1h' });
        if (!token) {
            return res.json({ status: 500, message: 'Error in token' });
        }

        return res.json({ status: 200, token, data: seller });

    } catch (error) {
        return res.json({ status: 500, message: 'Server error', error: error.message });
    }
}

const getAccountById = async (req, res) => {
    try {
        const { email_seller } = req.params

        if(!email_seller) {
            return res.json({ status: 400, message: 'Invalid input!'});
        }

        const resultAccount = await Seller.findOne(email_seller)
        if(!resultAccount) {
            return res.json({ status: 404, message: 'Seller not found!' });
        }
        
        return res.json({ status: 200, message: 'Successfully get data seller account', data: resultAccount });

    } catch (error) {
        return res.json({ status: 500, message: 'Server error', error: error.message });
    }
}

// Delete Account

const removeConsumer = async (req, res) => {
    try {
        const { consumer_id } = req.params

        const equalConsumer = await Consumer.findOne({ consumer_id })
        if(!equalConsumer) return res.json({ status: 404, message: 'User Not Found!' })

        const deleteConsumer = await Consumer.deleteOne({ consumer_id })
        if(!deleteConsumer) return res.json({ status: 500, message: 'Failed to delete user!' })

        return res.json({ status: 200, message: "Successfully to delete user", data: equalConsumer })
    } catch (error) {
        
    }
}

const removeSeller = async (req, res) => {
    try {
        const { seller_id } = req.params

        const equalSeller = await Seller.findOne({ seller_id })
        if(!equalSeller) return res.json({ status: 404, message: 'User Not Found!' })

        const deleteSeller = await Seller.deleteOne({ seller_id })
        if(!deleteSeller) return res.json({ status: 500, message: 'Failed to delete seller!' })

        return res.json({ status: 200, message: "Successfully to delete seller", data: equalSeller })
    } catch (error) {
        return res.json({ status: 500, message: 'Error server', error })
    }
}


// Get all account

const getAllConsumer = async (req, res) => {
    try {
        const { consumer_id } = req.params
        const filter = {}

        if(consumer_id) filter.consumer_id = consumer_id

        const getConsumer = await Consumer.find(filter)

        return res.json({ status: 200, message: 'Successfully get users', data: getConsumer })

    } catch (error) {
        return res.json({ status: 500, message: 'Error server', error })
    }
}

const getAllSeller = async (req, res) => {
    try {
        const { seller_id } = req.params
        const filter = {}

        if(seller_id) filter.seller_id = seller_id

        const getSeller = await Seller.find(filter)

        return res.json({ status: 200, message: 'Successfully get users', data: getSeller })

    } catch (error) {
        return res.json({ status: 500, message: 'Error server', error })
    }
}

const updateSellerAccount = async (req, res) => {
    try {
        const { seller_id } = req.params
        const { seller_name, email_seller, telephone_seller, gender, instagram, twitter, birthday } = req.body
        
        const requiredFields = ['email_seller', 'seller_name', 'gender', 'telephone_seller', 'birthday'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.json({ status: 401, message: 'Fields are missing'});
        }
        
        const seller_image = req.file ? req.file.filename : undefined;

        const filter = { seller_id }
        const set = { 
            seller_name, 
            email_seller, 
            telephone_seller, 
            gender, 
            instagram, 
            twitter, 
            birthday,
            seller_image
         } 

         const update = await Seller.updateOne(filter, set)
         if(update) {
             return res.json({ status: 200, message: 'Successfully for update data account!', data: set })
         }else {
             return res.json({ status: 500, message: 'Update account failed!', error: error.message })
         }

    } catch (error) {
        return res.json({ status: 500, message: 'Server error!', error: error.message })
    }
}

const updateConsumerAccount = async (req, res) => {
    try {
        const { consumer_id } = req.params
        const { consumer_name, email_consumer, telephone_consumer, gender, post_code, address } = req.body
        
        const requiredFields = ['email_consumer', 'consumer_name', 'gender', 'telephone_consumer'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.json({ status: 401, message: 'Fields are missing'});
        }
        
        const equalConsumer = await Consumer.findOne({email_consumer})
        if(!equalConsumer) return res.json({ status: 404, message: 'User not found!' })

        const oldImage = equalConsumer.consumer_image;
        const consumer_image = req.file ? req.file.filename : undefined;

        const filter = { consumer_id }
        const set = { 
            consumer_name, 
            email_consumer, 
            telephone_consumer, 
            gender, 
            post_code, 
            address, 
            consumer_image
         } 

        if(oldImage !== 'default.png' && consumer_image) {
            try {
                const imagePath = path.join(__dirname, '..', 'uploads', oldImage);
                await fs.promises.unlink(imagePath);
            } catch(error) {
                return res.json({ status: 500, message: 'Error removing old image!', error: error.message })
            }
        }

         const update = await Consumer.updateOne(filter, set)
         if(update) {
             return res.json({ status: 200, message: 'Successfully for update data account!', data: set })
         }else {
             return res.json({ status: 500, message: 'Update account failed!', error: error.message })
         }

    } catch (error) {
        return res.json({ status: 500, message: 'Server error!', error: error.message })
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email_seller } = req.body

        const equalEmail = await Seller.findOne({email_seller})
        if(!equalEmail) return res.json({ status: 404, message: 'Seller not found!' })

        const resetTokenPassword = crypto.randomBytes(20).toString('hex')

        const filter = { email_seller }
        const set = {
            resetTokenPassword
        }

        await Seller.updateOne(filter, set)

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: '',
                pass: ''
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
                        <h2>Reset Your Password</h2>
                        <p>You are receiving this email because you (or someone else) has requested to reset the password for your account. Please click the link below to reset your password:</p>
                        <a href="http://localhost:5174/auth/reset-password/${resetTokenPassword}">Reset Password</a>
                        <p>If you didn't request this, please ignore this email, and your password will remain unchanged.</p>
                    </div>
                </body>
            </html>
        `;

        const mailOptions = {
            to: email_seller,
            from: 'muhammadkhoirulhuda111@gmail.com',
            subject: 'Reset password by ElectShop',
            html: emailContent
        }

        transporter.sendMail(mailOptions, async (err) => {
            if(err) return res.json({ status: 500, message: 'Email sending failed!', error: err.message })
            return res.json({ status: 200, message: 'Email sent successfully!' })
        })

    } catch (error) {
        return res.json({ status: 500, message: 'Server error!', error: error.message })
    }
}

const resetPassword = async (req, res) => {
    try {   
        const { password } = req.body
        const { token } = req.params 

        if (!password) {
            return res.status(400).json({ status: 400, message: 'Password is required' });
        }
          
        const equalEmail = await Seller.findOne({ 
            resetTokenPassword: token,
        })
        if(!equalEmail) return res.json({ status: 404, message: 'Invalid or expired token!' })
        
        const salt = await bcrypt.genSalt(10)
        const newPassword = await bcrypt.hash(password, salt)

        const filter = { resetTokenPassword: token }
        const set = {
            password: newPassword,
            resetTokenPassword: '',
        }

        const updateResult = await Seller.updateOne(filter, set)

        if (updateResult) {
            return res.status(200).json({ status: 200, message: 'Password successfully reset' });
        } else {
            return res.status(500).json({ status: 500, message: 'Failed to reset password' });
        }

    } catch (error) {
        return res.json({ status: 500, message: 'Server failed!', error: error.message })
    }
}

module.exports = {
    signUpConsumer,
    signInConsumer,
    signUpSeller,
    signInSeller,
    removeConsumer,
    removeSeller,
    getAllConsumer,
    getAllSeller,
    updateSellerAccount,
    updateConsumerAccount,
    forgotPassword,
    resetPassword,
    upload
}