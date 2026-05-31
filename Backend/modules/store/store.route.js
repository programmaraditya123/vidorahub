const express = require('express');
const { addProductController,deleteProduct ,updateProduct, getProductsController, getAllProducts} = require('./store.contoller');
const { requireSignIn } = require('../auth/auth.middleware');
const router = express.Router();

router.post('/addProduct',requireSignIn,addProductController)

router.delete('/deleteProduct/:productId',requireSignIn,deleteProduct)

router.put('/updateProduct/:productId',requireSignIn,updateProduct);

router.get('/getProducts',requireSignIn,getProductsController)

router.get('/allProducts/:creatorId',getAllProducts)


module.exports = router;