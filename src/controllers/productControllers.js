const productModel = require("../models/productModel")
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const getAllProducts = async (req, res) => {
    try {
        const { shop_id, product_id } = req.params    
        const { brand, size, color, name } = req.query;

        let filter = {}

        if (shop_id) filter.shop_id = shop_id
        if (product_id) filter.product_id = product_id
        if (brand) filter.product_brand = brand;
        if (size) filter.product_size = size;
        if (color) filter.product_color = color;
        if (name) {
            // Membuat ekspresi reguler dari nama yang diberikan
            const regex = new RegExp(name, 'i');
            // Menambahkan ekspresi reguler ke filter
            filter.product_name = regex;
        }
        
        let productResult = await productModel.find(filter)
        if(productResult.length === 0) return res.json({ status: 404, message: 'Product not found!' })
      
        return res.json({ status: 200, data: productResult, message: 'All data product' })

    } catch (error) {
        return res.json({ status: 500, message: 'Faild get all products!', error: error.message })
    }
}

const getProductById = async (req, res) => {
    try {
        const { product_id } = req.params    
        let filter = {}

        if (product_id) filter.product_id = product_id

        let productResult = await productModel.find(filter)
        if(productResult.length === 0) return res.json({ status: 404, message: `Product with product id: ${product_id} not found!` })
      
        return res.json({ status: 200, data: productResult, message: 'All data product' })

    } catch (error) {
        return res.json({ status: 500, message: error.message })
    }
}

const getProductByShopId = async (req, res) => {
    try {
        const { shop_id } = req.params    
        let filter = {}

        if (shop_id) filter.shop_id = shop_id

        let productResult = await productModel.find(filter)
        if(productResult.length === 0) return res.json({ status: 404, message: `Product with product id: ${product_id} not found!` })
      
        return res.json({ status: 200, data: productResult, message: `All data product by shop_id=${shop_id}` })

    } catch (error) {
        return res.json({ status: 500, message: error.message })
    }
}

const removeProductById = async (req, res) => {
    try {
        const { product_id } = req.params
        
        const equalProductId = await productModel.findOne({product_id})
        if(!equalProductId) return res.json({ status: 404, message: 'Product not found!' })

        const dataProductDelete = await productModel.deleteOne({product_id})

        if(!dataProductDelete) return res.json({ status: 404, message: 'Failed to delete product' })

        return res.json({ status: 200, message: 'Successfully delete product' })
        
    } catch (error) {
        return res.json({ status: 500, message: 'An error occurred while deleting the product' })
    }
} 

const uploadDir = path.join(__dirname, '../uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const extname = path.extname(file.originalname);
        const originalFileName = file.originalname;
        const fileNameWithoutExtension = path.parse(originalFileName).name.split(' ').join('');

        cb(null, `${fileNameWithoutExtension}_${Date.now()}${extname}`);
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batasan ukuran 5Mb
    fileFilter: (req, file, cb) => {
        const allowExtensions = ['.jpg', '.png', '.jpeg']
        const extname = path.extname(file.originalname)

        if (allowExtensions.includes(extname)) {
            cb(null, true);
        } else {
            const error = new Error('Hanya file dengan ekstensi jpg, jpeg, atau png yang diperbolehkan.');
            cb(error);
        }
    }
})

const createProduct = async (req, res) => {
    try {
        const { 
            product_name, 
            shop_id, 
            product_type, 
            product_category, 
            product_color, 
            product_description, 
            product_price, 
            product_size, 
            product_brand, 
            quantity,
            shop_name,
            image_shop 
        } = req.body  

        if (!product_name || !shop_id || !product_type || !product_color || !product_description || !product_price || !product_size || !product_brand || !quantity) {
            return res.status(400).json({ status: 400, message: 'Incomplete data provided!' });
        }

        const equalProduct = await productModel.findOne({ product_name, shop_id, product_size });
        if(equalProduct) return res.json({ status: 401, message: 'Product already exist!' })
        
        if(!req.file) {
            return res.json({ status: 404, message: 'File not found!' })
        }

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

        // Push data ke schema/database
        const createNewProduct = new productModel({
            shop_id,
            product_id: randomString,
            product_name,
            product_type,
            product_color,
            product_description,
            product_image: req.file.filename,
            product_price,
            product_size,
            product_category,
            product_brand,
            quantity,
            shop_name,
            image_shop 
        })
        
        await createNewProduct.save()
        
        return res.json({ status: 200, message: 'Successfully add new product!' })

    } catch (error) {
        return res.json({ status: 500, message: error })
    }
}


const updateProduct = async (req, res) => {
    try {
        const { product_id } = req.params
        const { product_name, product_type, product_category, product_color, product_description, product_price, product_size, product_brand, quantity } = req.body  
        
        const equalProduct = await productModel.findOne({product_id})
        if(!equalProduct) return res.json({ status: 404, message: 'Product not found!' })
        
        const oldImage = equalProduct.product_image
        const product_image = req.file ? req.file.filename : undefined;

        const filter = { product_id }
        const set = { 
            product_name,
            product_type,
            product_color,
            product_description,
            product_image,
            product_price,
            product_brand,
            product_size,
            product_category,
            quantity
         }

        const update = await productModel.updateOne(filter, set)
        if(!update) return res.json({ status: 500, message: 'Failed to update product!' })

        if(oldImage && product_image) {
            try {
                const imagePath = path.join(__dirname, '..', 'uploads', oldImage);
                await fs.promises.unlink(imagePath);
            } catch(error) {
                return res.json({ status: 500, message: 'Error removing old image!', error: error.message })
            }
        }

        return res.json({ status: 200, message: 'Successfully to update product!' })

    } catch (error) {
        return res.json({ status: 500, message: 'Failed to update product', error: error.message })
    }
}


module.exports = {
    getAllProducts,
    createProduct,
    removeProductById,
    updateProduct,
    getProductById,
    getProductByShopId,
    upload
}