const shopModel = require('../models/shopModel')
const revenueModel = require('../models/requestModel')
const productModel = require('../models/productModel')
const paymentMethodSchema = require('../models/methodePayment')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

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

const createShop = async (req, res) => {
    try {
        const { 
            seller_name, 
            shop_name, 
            seller_id,
            email_seller, 
            telephone_seller, 
            motto_shop, 
            description_shop, 
            shop_address
        } = req.body 

        const equalEmail = await shopModel.findOne({ email_seller });

        if (equalEmail) {
            return res.json({ status: 401, message: 'Shop already exists' });
        }

        if (!req.file) {
            return res.json({ status: 401, message: 'File Not Found' });
        }

        const id = crypto.randomBytes(5).toString('hex')

        const data = {
            shop_id: id,
            payments: [
                { bank_code: 'ID_BCA' },
                { bank_code: 'ID_BRI' },
                { bank_code: 'ID_MANDIRI' },
                { bank_code: 'ID_BNI' },
                { bank_code: 'ID_DANA' },
                { bank_code: 'ID_GOPAY' },
                { bank_code: 'ID_OVO' },
                { bank_code: 'ID_SHOPEEPAY' },
            ]
        }
        
        const createShopData = {
            shop_id: id,
            seller_name,
            shop_name,
            seller_id,
            email_seller,
            telephone_seller,
            motto_shop,
            description_shop,
            shop_address,
            image_shop: req.file.filename,
            followers: 0,
        };

        const dataRAS = {
            revenue_id: id,
        }

        const createPayment = new paymentMethodSchema(data)
        const createShopModel = new shopModel(createShopData);
        const createRevenueModel = new revenueModel(dataRAS);

        const [paymentMethod, shop, ras] = await Promise.all([
            createPayment.save(),
            createShopModel.save(),
            createRevenueModel.save(),
        ]);

        if (paymentMethod && shop && ras) {
            return res.json({ status: 200, message: 'Successfully create shop!' });
        } else {
            if (!paymentMethod) {
                return res.json({ status: 200, message: 'Failed to create payment!' });
            } else if (!shop) {
                return res.json({ status: 200, message: 'Failed to create shop!' });
            } else if (!ras) {
                return res.json({ status: 200, message: 'Failed to create revenue!' });
            }
        }
        
    } catch (error) {
        console.log(req)
        console.error(error); // Cetak kesalahan ke konsol
        return res.json({ status: 500, message: 'Failed to create shop!', error: error.message  });
    }   
}


const getAllShop = async (req, res) => {
    try {
        const { seller_id } = req.params
        const filter = {}
        if(seller_id) filter.seller_id = seller_id 
        
        const dataShop = await shopModel.find(filter)
        if(!dataShop) return res.json({ status: 404, message: 'Shop not found!' })

        return res.json({ status: 200, data: dataShop })

    } catch (error) {
        return res.json({ status: 500, message: 'Failed to get data', error: error.message });
    }
}

const getAllShopByShopID = async (req, res) => {
    try {
        const { id } = req.params
        console.log(id)
        const dataShop = await shopModel.findOne({ shop_id: id })
        if(!dataShop) return res.json({ status: 404, message: 'Shop not found!' })
        console.log(dataShop)
        return res.json({ status: 200, data: dataShop })

    } catch (error) {
        return res.json({ status: 500, message: 'Failed to get data', error: error.message });
    }
}

const removeShopById = async (req, res) => {
    try {
        const { shop_id } = req.params

        const equalShopId = await shopModel.findOne({shop_id})
        if(!equalShopId) return res.json({ status: 404, message: 'Shop not found!' })
        
        const dataShopDelete = await shopModel.deleteOne({shop_id})
        if(!dataShopDelete) return res.json({ status: 404, message: 'Failed to delete shop' })
        
        await productModel.deleteMany({ shop_id });
        await paymentMethodSchema.deleteOne({ shop_id });
        await revenueModel.deleteOne({ revenue_id: shop_id });

        return res.json({ status: 200, message: 'Successfully delete shop', data: equalShopId })
    
    } catch (error) {
        return res.json({ status: 500, message: 'Failed to delete shop', error: error.message });
    }
}

const updateShop = async (req, res) => {
    try {
        const { shop_id } = req.params
        const { seller_name, shop_name, shop_address, motto_shop, description_shop, telephone_seller, followers } = req.body;
        
        const equalShop = await shopModel.findOne({ shop_id })
        if(!equalShop) return res.json({ status: 404, message: 'Shop not found!' })
        
        const oldImage = equalShop.image_shop; // Ambil oldImage sebelum mengganti image_shop
        const image_shop = req.file ? req.file.filename : undefined;
        
        const filter = { shop_id }
        const set = { 
            seller_name,
            shop_name,
            shop_address,
            image_shop,
            motto_shop,
            description_shop,
            telephone_seller,
            followers
        }
        
        const update = await shopModel.updateOne(filter, set)
        
        if(!update) {
            console.error('Gagal memperbarui data toko:', update);
            return res.json({ status: 500, message: 'Failed to update shop!', img_old: oldImage })
        }
    
        if(oldImage && image_shop) {
            try {
                const imagePath = path.join(__dirname, '..', 'uploads', oldImage);
                await fs.promises.unlink(imagePath);
            } catch(error) {
                return res.json({ status: 500, message: 'Error removing old image!', error: error.message })
            }
        }
        
        return res.json({ status: 200, message: 'Successfully to update product!'})
        // return res.json({ status: 200, message: 'Successfully to update product!'})
    
    } catch (error) {
        return res.json({ status: 500, message: 'Failed to update product', error: error.message })
    }
}


module.exports = {
    getAllShop,
    removeShopById,
    createShop,
    updateShop,
    getAllShopByShopID,
    upload
}