
const mongoose = require("mongoose");
const Product = require("./store.model");
const Category = require("../categorysubcategory/category.model");
const Subcategory = require("../categorysubcategory/subcategory.model");

// Validate that category and subcategory exist, are active,
// and belong to each other.
const validateCategoryPair = async (categoryId, subcategoryId) => {
  if (
    !mongoose.isValidObjectId(categoryId) ||
    !mongoose.isValidObjectId(subcategoryId)
  ) {
    return {
      valid: false,
      status: 400,
      message: "Valid category and subcategory IDs are required",
    };
  }

  const category = await Category.findOne({
    _id: categoryId,
    isActive: true,
  }).select("_id");

  if (!category) {
    return {
      valid: false,
      status: 400,
      message: "Category not found or inactive",
    };
  }

  const subcategory = await Subcategory.findOne({
    _id: subcategoryId,
    category: category._id,
    isActive: true,
  }).select("_id");

  if (!subcategory) {
    return {
      valid: false,
      status: 400,
      message:
        "Subcategory not found, inactive, or does not belong to the selected category",
    };
  }

  return { valid: true };
};

// ========================================
// ADD PRODUCT
// ========================================
const addProductController = async (req, res) => {
  try {
    const { id } = req.user;

    const {
      name,
      description,
      category,
      subcategory,
      price,
      stock,
      images,
      brand,
      currency,
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid non-negative price is required",
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    if (typeof currency !== "string" || !currency.trim()) {
      return res.status(400).json({
        success: false,
        message: "Currency is required",
      });
    }

    // Validate the selected category and subcategory.
    const validation = await validateCategoryPair(
      category,
      subcategory
    );

    if (!validation.valid) {
      return res.status(validation.status).json({
        success: false,
        message: validation.message,
      });
    }

    const product = await Product.create({
      creatorId: id,
      name: name.trim(),
      description,
      category: new mongoose.Types.ObjectId(category),
      subcategory: new mongoose.Types.ObjectId(subcategory),
      price: Number(price),
      stock,
      images,
      brand,
      currency: currency.trim(),
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("addProductController:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// DELETE PRODUCT (SOFT DELETE)
// ========================================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.user;
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.creatorId.toString() !== id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this product",
      });
    }

    await Product.findByIdAndUpdate(
      productId,
      { $set: { status: "inactive" } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("deleteProduct:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// UPDATE PRODUCT
// ========================================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.user;
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.creatorId.toString() !== id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this product",
      });
    }

    const {
      name,
      description,
      category,
      subcategory,
      price,
      stock,
      images,
      brand,
      currency,
    } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty",
        });
      }

      updates.name = name.trim();
    }

    if (description !== undefined) updates.description = description;
    if (stock !== undefined) updates.stock = stock;
    if (brand !== undefined) updates.brand = brand;

    if (images !== undefined) {
      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one image is required",
        });
      }

      updates.images = images;
    }

    if (price !== undefined) {
      if (
        price === "" ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid non-negative price is required",
        });
      }

      updates.price = Number(price);
    }

    if (currency !== undefined) {
      if (typeof currency !== "string" || !currency.trim()) {
        return res.status(400).json({
          success: false,
          message: "Currency cannot be empty",
        });
      }

      updates.currency = currency.trim();
    }

    // If either selection changes, validate the complete pair.
    if (category !== undefined || subcategory !== undefined) {
      const nextCategory = category ?? product.category;
      const nextSubcategory = subcategory ?? product.subcategory;

      const validation = await validateCategoryPair(
        nextCategory,
        nextSubcategory
      );

      if (!validation.valid) {
        return res.status(validation.status).json({
          success: false,
          message: validation.message,
        });
      }

      updates.category = nextCategory;
      updates.subcategory = nextSubcategory;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("updateProduct:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// GET CREATOR'S PRODUCTS
// ========================================
const getProductsController = async (req, res) => {
  try {
    const creatorId = req.user.id ?? req.user._id;

    const products = await Product.find({
      creatorId,
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("getProductsController:", error);

    return res.status(500).json({
      success: false,
      message: "Error in fetching products",
    });
  }
};

// ========================================
// GET ACTIVE PRODUCTS BY CREATOR
// ========================================
const getAllProducts = async (req, res) => {
  try {
    const { creatorId } = req.params;

    if (!mongoose.isValidObjectId(creatorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid creator ID",
      });
    }

    const products = await Product.find({
      creatorId,
      status: "active",
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("getAllProducts:", error);

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
  getAllProducts,
};




// // import Product from "../models/product.model.js";
// const Product = require("./store.model");
 

// const addProductController = async (req, res) => {
//   try {
//     const { id } = req.user;

//     const {
//       name,
//       description,
//       category,
//       price,
//       stock,
//       images,
//       brand,
//       currency,
//     } = req.body;

//     if (!name) {
//       return res.status(400).json({
//         success: false,
//         message: "Product name is required",
//       });
//     }

//     if (!price) {
//       return res.status(400).json({
//         success: false,
//         message: "Price is required",
//       });
//     }

//     if (!images || images.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one image is required",
//       });
//     }

//     if (!currency) {
//       return res.status(400).json({
//         success: false,
//         message: "Currency is required",
//       });
//     }

//     const product = await Product.create({
//       creatorId: id,
//       name,
//       description,
//       category,
//       price,
//       stock,
//       images,
//       brand,
//       currency,
//       status: "active",
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       product,
//     });
//   } catch (error) {
//     // console.log(error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// const deleteProduct = async (req,res) => {
//   try {
//     const {id} = req.user;
//     const {productId} = req.params;
//     const product = await Product.findById(productId);
//     if(!product){
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }
//     if(product.creatorId.toString() !== id.toString()){
//       return res.status(403).json({
//         success: false,
//         message: "You are not allowed to delete this product",
//       });
//     }
//     await Product.findByIdAndUpdate(productId,
//       {$set : {status : "inactive"}},
//       {new : true}
//     )
//     return res.status(200).json({
//       success: true,
//       message: "Product deleted successfully",
//     }); 
    
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
    
//   }
// }

// const updateProduct = async (req,res) => {
//   try {
//     const {id} = req.user;
//     const {productId} = req.params;
//     const {name,description,category,price,stock,images,brand,currency} = req.body;
//     const product = await Product.findById(productId);
//     if(!product){
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }
//     if(product.creatorId.toString() !== id.toString()){
//       return res.status(403).json({
//         success: false,
//         message: "You are not allowed to update this product",
//       });
//     }
//     await Product.findByIdAndUpdate(productId,
//       {$set : {name,description,category,price,stock,images,brand,currency}},
//       {new : true}
//     )
//     return res.status(200).json({
//       success: true,
//       message: "Product updated successfully",
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// }

// const getProductsController = async (req, res) => {
//   try {
//     const creatorId = req.user._id;

//     const products = await Product.find({
//       creatorId,
//     }).sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: products.length,
//       products,
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Error in fetching products",
//     });
//   }
// };

// const getAllProducts = async (req, res) => {
//   try {
//     const { creatorId } = req.params;

//     const products = await Product.find({
//       creatorId,
//       status: "active",
//     }).sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: products.length,
//       products,
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Error in fetching creator products",
//     });
//   }
// };

// module.exports = {
//     addProductController,
//     deleteProduct,
//     updateProduct,
//     getProductsController,
//     getAllProducts
// }