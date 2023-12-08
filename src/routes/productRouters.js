const express = require('express');
const productControllers = require('../controllers/productControllers');
const router = express.Router();

router.post('/', productControllers.upload.single('product_image'), productControllers.createProduct);
router.get('/:shop_id?', productControllers.getAllProducts);
router.get('/Oneproduct/:product_id?', productControllers.getProductById);
router.get('/shop/:shop_id?', productControllers.getProductByShopId);
router.delete('/:product_id', productControllers.removeProductById);
router.put('/:product_id', productControllers.upload.single('product_image'), productControllers.updateProduct);

module.exports = router;
