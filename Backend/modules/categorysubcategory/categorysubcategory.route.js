
const express = require("express");
const router = express.Router();

const {
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryStatus,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  setSubcategoryStatus,
  getCategories,
  getSubcategories,
  getSubcategoriesByCategory
} = require("./categorysubcategory.controller");

// ==================== CATEGORY ====================

router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);
router.patch("/categories/:id/status", setCategoryStatus);

// ==================== SUBCATEGORY ====================

router.get("/subcategories", getSubcategories);
router.post("/subcategories", createSubcategory);
router.patch("/subcategories/:id", updateSubcategory);
router.delete("/subcategories/:id", deleteSubcategory);
router.patch("/subcategories/:id/status", setSubcategoryStatus);
router.get("/categories/:categoryId/subcategories",getSubcategoriesByCategory);


module.exports = router;
