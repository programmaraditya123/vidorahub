
const mongoose = require("mongoose");
const Category = require("./category.model");
const Subcategory = require("./subcategory.model");

const isValidId = (id) => mongoose.isValidObjectId(id);

const categoryFields = ["name", "slug", "description"];
const subcategoryFields = ["name", "slug", "description"];

// Helper: allow only permitted fields
const getUpdates = (body, fields) => {
  const updates = {};

  for (const field of fields) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string") {
        throw new Error(`${field} must be a string`);
      }

      updates[field] = body[field].trim();

      if (field === "slug") {
        updates[field] = updates[field].toLowerCase();
      }
    }
  }

  if (updates.name !== undefined && !updates.name) {
    throw new Error("Name cannot be empty");
  }

  if (updates.slug !== undefined && !updates.slug) {
    throw new Error("Slug cannot be empty");
  }

  return updates;
};

const handleError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this slug already exists",
    });
  }

  if (
    error.message?.includes("must be a string") ||
    error.message === "Name cannot be empty" ||
    error.message === "Slug cannot be empty"
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};



const getCategories = async (req, res) => {
  try {
    const { isActive, search } = req.query;

    const filter = {};

    if (isActive !== undefined) {
      if (!["true", "false"].includes(isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      filter.isActive = isActive === "true";
    }

    if (search?.trim()) {
      filter.name = {
        $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    const categories = await Category.find(filter).sort({
      name: 1,
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getSubcategories = async (req, res) => {
  try {
    const { category, isActive, search } = req.query;

    const filter = {};

    if (category !== undefined) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      filter.category = category;
    }

    if (isActive !== undefined) {
      if (!["true", "false"].includes(isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      filter.isActive = isActive === "true";
    }

    if (search?.trim()) {
      filter.name = {
        $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    const subcategories = await Subcategory.find(filter)
      .populate("category", "name slug isActive")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories,
    });
  } catch (error) {
    return handleError(res, error);
  }
};


// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
      !slug.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name and slug are required",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description:
        typeof description === "string" ? description.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PATCH /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const updates = getUpdates(req.body, categoryFields);

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided",
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const hasSubcategories = await Subcategory.exists({
      category: id,
    });

    if (hasSubcategories) {
      return res.status(409).json({
        success: false,
        message:
          "Delete or reassign subcategories before deleting this category",
      });
    }

    await Category.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PATCH /api/categories/:id/status
const setCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Category ${isActive ? "enabled" : "disabled"} successfully`,
      data: category,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// ========================================
// SUBCATEGORY CONTROLLERS
// ========================================

// POST /api/subcategories
const createSubcategory = async (req, res) => {
  try {
    const { name, slug, category, description } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
      !slug.trim() ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, slug and category ID are required",
      });
    }

    if (!isValidId(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const parent = await Category.findOne({
      _id: category,
      isActive: true,
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Active parent category not found",
      });
    }

    const subcategory = await Subcategory.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      category: parent._id,
      description:
        typeof description === "string" ? description.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Subcategory created successfully",
      data: subcategory,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PATCH /api/subcategories/:id
const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategory ID",
      });
    }

    const updates = getUpdates(req.body, subcategoryFields);

    if (req.body.category !== undefined) {
      const categoryId = req.body.category;

      if (!isValidId(categoryId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      const parent = await Category.findOne({
        _id: categoryId,
        isActive: true,
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Active parent category not found",
        });
      }

      updates.category = parent._id;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided",
      });
    }

    const subcategory = await Subcategory.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
      data: subcategory,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// DELETE /api/subcategories/:id
const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategory ID",
      });
    }

    const subcategory = await Subcategory.findById(id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    // Check for associated products here before deletion.
    await Subcategory.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PATCH /api/subcategories/:id/status
const setSubcategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategory ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const subcategory = await Subcategory.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true, runValidators: true }
    );

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Subcategory ${isActive ? "enabled" : "disabled"} successfully`,
      data: subcategory,
    });
  } catch (error) {
    return handleError(res, error);
  }
};


const getSubcategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.isValidObjectId(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findOne({
      _id: categoryId,
      isActive: true,
    }).select("_id");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Active category not found",
      });
    }

    const subcategories = await Subcategory.find({
      category: categoryId,
      isActive: true,
    })
      .select("_id name")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories,
    });
  } catch (error) {
    console.error("getSubcategoriesByCategory:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subcategories",
    });
  }
};


module.exports = {
  getCategories,
  getSubcategories,
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryStatus,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  setSubcategoryStatus,
  getSubcategoriesByCategory,
};
