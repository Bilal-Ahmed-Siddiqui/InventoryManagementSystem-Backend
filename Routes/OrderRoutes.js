const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const auth = require("../Middlewares/Auth");
const Order = require("../Models/Order");


//create order endpoint
router.post(
  "/create",
  auth,
  [
    body("productList.productId")
      .notEmpty()
      .isMongoId()
      .withMessage("product id  is required, must be a valid MongoDB ID"),
    body("productList.quantity")
      .notEmpty()
      .isNumeric()
      .withMessage("quantity is required, must be a numeric value"),
    body("productList.price")
      .notEmpty()
      .isNumeric()
      .withMessage("price is required, must be a numeric value"),
    body("userId")
      .notEmpty()
      .isMongoId()
      .withMessage("userId is required, must be a valid MongoDB ID"),
    body("totalPrice")
      .notEmpty()
      .isNumeric()
      .withMessage("total price is required, must be a numeric value"),
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error });
    }
    try {
      const { productList, userId, totalPrice } = req.body;
      const newOrder = new Order({ productList, userId, totalPrice });
      await newOrder.save();
      res.status(201).json(newOrder);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
