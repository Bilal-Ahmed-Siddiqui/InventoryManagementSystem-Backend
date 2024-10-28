const express = require("express");
const Product = require("../Models/Product");
const router = express.Router();

//get all products
router.get("/getall", async (req, res) => {
  try {
    const products = await Product.find().populate("Category");

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//get Product by id
router.get("/:id", async (req, res) => {
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
router.post("/create", async (req, res) => {
  try {
    const { Name, Price, Quantity, inStock, Category } = req.body;
    const newProduct = new Product({
      Name,
      Price,
      Quantity,
      inStock,
      Category,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Update Product
router.put("/:id", async (req, res) => {
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
});

//delete product
router.delete("/:id", async (req, res) => {
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
