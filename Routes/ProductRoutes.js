const express = require("express");
const Product = require("../Models/Product");
const { body, validationResult } = require("express-validator");
const auth = require("../Middlewares/Auth");
const upload = require("../Middlewares/Upload");
const router = express.Router();

//get all products
router.get("/getall", auth, async (req, res) => {
  try {
    const products = await Product.find().populate("Category");

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//get Product by id
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id }).populate("Category");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//create Product endpoint
router.post(
  "/create",
  auth,
  upload.single('productPicture'),
  [
    (req, res, next) => {
      if (req.body.jsonData) {
        try {
          req.body.jsonData = JSON.parse(req.body.jsonData);
        } catch (error) {
          return res.status(400).json({ error: "Invalid JSON format in jsonData" });
        }
      }
      next();
    },
    body("jsonData.Name")
      .notEmpty()
      .isString()
      .isLength({ max: 50 })
      .withMessage("name is required, max length 50 letters"),
    body("jsonData.Price")
      .notEmpty()
      .isNumeric()
      .withMessage("price is required, must be integer"),
    body("jsonData.Quantity")
      .notEmpty()
      .isNumeric()
      .withMessage("Quantity is required, must be integer"),
    body("jsonData.inStock")
      .notEmpty()
      .isBoolean()
      .withMessage("inStock is required, must be boolean"),
    body("jsonData.Category")
      .notEmpty()
      .isMongoId()
      .withMessage("Category is required, must be a mongoId"),
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error });
    }
    try {
      const { Name, Price, Quantity, inStock, Category } = req.body.jsonData;
      if(!req.file){
        return res.status(404).json({ error: "Product Picture not found"});
      }
      const userId = req.userId;
      const newProduct = new Product({
        Name,
        Price,
        Quantity,
        inStock,
        picture: `uploads/${req.file.filename}`,
        Category,
        userId,
      });

      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
//Update Product
router.put(
  "/:id",
  auth,
  [
    body("Name")
      .notEmpty()
      .isString()
      .isLength({ max: 50 })
      .withMessage("name is required, max length 50 letters"),
    body("Price")
      .notEmpty()
      .isNumeric()
      .withMessage("price is required, must be integer"),
    body("Quantity")
      .notEmpty()
      .isNumeric()
      .withMessage("Quantity is required, must be integer"),
    body("inStock")
      .notEmpty()
      .isBoolean()
      .withMessage("inStock is required, must be boolean"),
    body("Category")
      .notEmpty()
      .isMongoId()
      .withMessage("Category is required, must be a mongoId"),
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error });
    }
    try {
      const { id } = req.params;
      const { Name, Price, Quantity, inStock, Category } = req.body;

      const updatedProduct = await Product.findByIdAndUpdate(
        { _id: id },
        { Name, Price, Quantity, inStock, Category },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//delete product
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete({ _id: id });

    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json({ success: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
