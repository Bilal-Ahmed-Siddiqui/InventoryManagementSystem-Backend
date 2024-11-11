const express = require("express");
const Category = require("../Models/Category");
const auth = require("../Middlewares/Auth")
const { body, validationResult } = require("express-validator");
const router = express.Router();

//create category endpoint
router.post(
  "/create",
  auth,
  [
    body("name")
      .notEmpty()
      .isString()
      .isLength({ max: 50 })
      .withMessage("name is required, max length 50 letters"),
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error });
    }
    try {
      const { name } = req.body;
      const userId = req.userId;
      const newCategory = new Category({ name, userId });
      const savedCategory = await newCategory.save();
      res.status(201).json(savedCategory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//get all categories
router.get("/getAll", auth, async (req, res) => {
  try {
    const categories = await Category.find();
    if (!categories) {
      return res.status(404).json({ error: "categories not found" });
    }

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//get category by id categories
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ _id: id });

    if (!category) {
      return res.status(404).json({ error: "category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update category
router.put(
  "/:id",
  auth,
  [
    body("name")
      .notEmpty()
      .isString()
      .isLength({ max: 50 })
      .withMessage("name is required, max length 50 letters"),
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error });
    }
    try {
      const { id } = req.params;
      const { name } = req.body;

      const updatedCategory = await Category.findByIdAndUpdate(
        { _id: id },
        { name },
        { new: true }
      );

      if (!updatedCategory) {
        return res.status(404).json({ error: "category not found" });
      }
      return res.status(200).json(updatedCategory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//delete category
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await Category.findByIdAndDelete({ _id: id });

    if (!deletedCategory) {
      return res.status(404).json({ error: "category not found" });
    }
    return res.status(200).json({ success: "category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
