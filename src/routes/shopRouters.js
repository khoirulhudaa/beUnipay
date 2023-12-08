const express = require('express')
const router = express.Router()
const shopController = require('../controllers/shopController')

router.post('/', shopController.upload.single('image_shop'), shopController.createShop)
router.get('/:seller_id', shopController.getAllShop)
router.get('/oneShop/:id', shopController.getAllShopByShopID)
router.post('/:shop_id', shopController.upload.single('image_shop'), shopController.updateShop)
router.delete('/:shop_id', shopController.removeShopById)

module.exports = router