const multer = require('multer');
const User = require('../models/userModel')
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

const signUp = async (req, res) => {
    try {
        const { email, password, gender, number_telephone, NIK, NIM, prodi, fullName } = req.body
       
        const equalUserByEmail = await User.findOne({ email })
        if(equalUserByEmail) return res.json({ status: 400, message: 'Email already exist!' })
        
        const equalUserByNIM = await User.findOne({ NIM })
        if(equalUserByNIM) return res.json({ status: 400, message: `User with NIM ${NIM} already exist!` })
 
        const id = crypto.randomBytes(20).toString('hex')

        const salt = await bcrypt.genSalt(10)
        const passwordHashGenerate = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullName,
            email,
            password: passwordHashGenerate,
            gender,
            user_id: id,
            number_telephone,
            NIK,
            NIM, 
            prodi
        })

        await newUser.save()
        return res.json({ status: 200, message: 'Successfully signup!' })

    } catch (error) {
        return res.json({ status: 500, message: 'Failed to signup!', error: error });
    }
}

const signIn = async (req, res) => {
    try {
        const {NIM, password} = req.body
        const user = await User.findOne({ NIM })
        if(!user) return res.json({ status: 404, message: 'User not found!' })

        const isMatch = await bcrypt.compare(password, User.password);

        if (!isMatch) {
            return res.json({ status: 401, message: 'Incorrect password!' });
        }

        const token = jwt.sign({ user_id: User.user_id }, 'Unipay', { expiresIn: '2h' });
        return res.json({ status: 200, token, data: user });
        
    } catch (error) {
        return res.json({ status: 500, message: 'Failed to signin!', error: error.message });
    }
} 

const getAccountById = async (req, res) => {
    try {
        const { email } = req.params

        if(!email) {
            return res.json({ status: 400, message: 'Invalid input!'});
        }

        const resultAccount = await User.findOne(email)
        if(!resultAccount) {
            return res.json({ status: 404, message: 'User not found!' });
        }
        
        return res.json({ status: 200, message: 'Successfully get data user account', data: resultAccount });

    } catch (error) {
        return res.json({ status: 500, message: 'Server error', error: error.message });
    }
}

const removeUser = async (req, res) => {
    try {
        const { user_id } = req.params

        const equalUser = await User.findOne({ user_id })
        if(!equalUser) return res.json({ status: 404, message: 'User Not Found!' })

        const deleteConsumer = await User.deleteOne({ user_id })
        if(!deleteConsumer) return res.json({ status: 500, message: 'Failed to delete user!' })

        return res.json({ status: 200, message: "Successfully to delete user", data: equalUser })
    } catch (error) {
        return res.json({ status: 500, message: 'Error server', error })
    }
}

const getAllUser = async (req, res) => {
    try {

        const user = await User.find()

        return res.json({ status: 200, message: 'Successfully get users', data: user })

    } catch (error) {
        return res.json({ status: 500, message: 'Error server', error })
    }
}

const updateUserAccount = async (req, res) => {
    try {
        const { user_id } = req.params
        const { fullName, email, number_telephone, gender, NIK, NIM, type_image, prodi } = req.body
        
        const requiredFields = ['email', 'fullName', 'prodi', 'NIM', 'NIK', 'gender', 'type_image'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.json({ status: 401, message: 'Fields are missing'});
        }
        
        const filter = { user_id }
        const set = { 
            fullName, 
            email, 
            number_telephone, 
            gender, 
            NIK, 
            NIM, 
            prodi,
            type_image
         } 

         const update = await User.updateOne(filter, set)
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
        const { email } = req.body

        const equalEmail = await User.findOne({email})
        if(!equalEmail) return res.json({ status: 404, message: 'User not found!' })

        const resetTokenPassword = crypto.randomBytes(8).toString('hex')

        const filter = { email }
        const set = {
            resetTokenPassword
        }

        await User.updateOne(filter, set)

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
                        <a href="http://localhost:3000/auth/reset-password/${resetTokenPassword}">Reset Password</a>
                        <p>If you didn't request this, please ignore this email, and your password will remain unchanged.</p>
                    </div>
                </body>
            </html>
        `;

        const mailOptions = {
            to: email,
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
            return res.status(400).json({ status: 400, message: 'Password is required!' });
        }
          
        const equalEmail = await User.findOne({ 
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

        const updateResult = await User.updateOne(filter, set)

        if (updateResult) {
            return res.status(200).json({ status: 200, message: 'Password successfully reset!' });
        } else {
            return res.status(500).json({ status: 500, message: 'Failed to reset password!' });
        }

    } catch (error) {
        return res.json({ status: 500, message: 'Server failed!', error: error.message })
    }
}

module.exports = {
    signUp,
    signIn,
    getAccountById,
    getAllUser,
    removeUser,
    updateUserAccount,
    forgotPassword,
    resetPassword,
    upload
}