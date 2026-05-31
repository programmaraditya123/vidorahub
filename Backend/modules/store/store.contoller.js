
// import Product from "../models/product.model.js";
const Product = require("./store.model");
 

const addProductController = async (req, res) => {
  try {
    const { id } = req.user;

    const {
      name,
      description,
      category,
      price,
      stock,
      images,
      brand,
      currency,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!price) {
      return res.status(400).json({
        success: false,
        message: "Price is required",
      });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    if (!currency) {
      return res.status(400).json({
        success: false,
        message: "Currency is required",
      });
    }

    const product = await Product.create({
      creatorId: id,
      name,
      description,
      category,
      price,
      stock,
      images,
      brand,
      currency,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    // console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteProduct = async (req,res) => {
  try {
    const {id} = req.user;
    const {productId} = req.params;
    const product = await Product.findById(productId);
    if(!product){
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    if(product.creatorId.toString() !== id.toString()){
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this product",
      });
    }
    await Product.findByIdAndUpdate(productId,
      {$set : {status : "inactive"}},
      {new : true}
    )
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    }); 
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
    
  }
}

const updateProduct = async (req,res) => {
  try {
    const {id} = req.user;
    const {productId} = req.params;
    const {name,description,category,price,stock,images,brand,currency} = req.body;
    const product = await Product.findById(productId);
    if(!product){
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    if(product.creatorId.toString() !== id.toString()){
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this product",
      });
    }
    await Product.findByIdAndUpdate(productId,
      {$set : {name,description,category,price,stock,images,brand,currency}},
      {new : true}
    )
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

const getProductsController = async (req, res) => {
  try {
    const creatorId = req.user._id;

    const products = await Product.find({
      creatorId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error in fetching products",
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { creatorId } = req.params;

    const products = await Product.find({
      creatorId,
      status: "active",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error in fetching creator products",
    });
  }
};

module.exports = {
    addProductController,
    deleteProduct,
    updateProduct,
    getProductsController,
    getAllProducts
}