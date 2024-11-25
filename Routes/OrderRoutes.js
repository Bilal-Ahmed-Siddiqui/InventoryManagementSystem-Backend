const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const auth = require("../Middlewares/Auth");
const Order = require("../Models/Order");
const Product = require("../Models/Product");

//create order endpoint
router.post(
  "/create",
  auth,
  [
    body("productList").isArray().withMessage("product list must be an array"),
    body("productList.*.productId")
      .notEmpty()
      .isMongoId()
      .withMessage("product id  is required, must be a valid MongoDB ID"),
    body("productList.*.quantity")
      .notEmpty()
      .isNumeric()
      .withMessage("quantity is required, must be a numeric value"),
    body("productList.*.price")
      .notEmpty()
      .isNumeric()
      .withMessage("price is required, must be a numeric value"),
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
      const { productList, totalPrice } = req.body;

      const promisesResult = await Promise.all(
        productList.map(async (item) => {
          const productExist = await Product.findOne({ _id: item.productId });
          if (!productExist) {
            throw new Error(
              `product with productid: ${item.productId} not found`
            );
          }
          if (!productExist.inStock) {
            throw new Error(`${productExist.Name} is out of stock`);
          }

          if (productExist.Quantity < item.quantity) {
            throw new Error(
              `${productExist.Name} is in insufficient quantity. Available Quantity: ${productExist.Quantity}`
            );
          }

          return {
            productId: item.productId,
            quantity: item.quantity,
            status: true,
          };
        })
      );

      if (promisesResult.every((result) => result.status == true)) {
        promisesResult.map(async (item) => {
          const product = await Product.findOne({ _id: item.productId });
          if (product) {
            product.Quantity -= item.quantity;
            if (product.Quantity === 0) {
              product.inStock = false;
            }
            await product.save();
          }
        });
        const userId = req.userId;
        const newOrder = new Order({ productList, userId, totalPrice });
        await newOrder.save();
        return res.status(201).json(newOrder);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//getall endpoint
router.get("/getall", auth, async (req, res) => {
  try {
    const orders = await Order.find();
    // .populate("productList.productId");

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//delete endpoint
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;

    // Find the order to be deleted
    const existingOrder = await Order.findOne({ _id });
    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update product quantities in stock for each product in the order
    for (const item of existingOrder.productList) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.Quantity += item.quantity; // Revert stock quantity
        if (product.Quantity > 0) {
          product.inStock = true; // Update inStock status
        }
        await product.save(); // Save updated product
      }
    }

    // Delete the order after processing all product updates
    await existingOrder.deleteOne();

    // Send success response
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: error.message });
  }
});

router.put(
  "/update/:id",
  auth,
  [
    body("productList").isArray().withMessage("productList must be an array"),
    body("productList.*.productId")
      .notEmpty()
      .isMongoId()
      .withMessage("productId is required and must be a valid MongoDB ID"),
    body("productList.*.quantity")
      .notEmpty()
      .isNumeric()
      .withMessage("quantity is required and must be a numeric value"),
    body("productList.*.price")
      .notEmpty()
      .isNumeric()
      .withMessage("price is required and must be a numeric value"),
    body("totalPrice")
      .optional()
      .isNumeric()
      .withMessage("totalPrice must be a numeric value if provided"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const orderId = req.params.id;
      const { productList, totalPrice } = req.body;

      const existingOrder = await Order.findById(orderId);
      if (!existingOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      for (const item of productList) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res
            .status(404)
            .json({ error: `Product with ID ${item.productId} not found` });
        }

        const existingProductIndex = existingOrder.productList.findIndex(
          (orderedProduct) =>
            orderedProduct.productId.toString() === item.productId
        );

        if (existingProductIndex !== -1) {
          // Product exists in the order; revert previous quantity
          const orderedProduct =
            existingOrder.productList[existingProductIndex];
          product.Quantity += orderedProduct.quantity;
          // Check for sufficient stock
          if (product.Quantity < item.quantity) {
            return res.status(400).json({
              error: `${product.Name} has insufficient stock. Available: ${product.Quantity}`,
            });
          }

          // Deduct new quantity and update order
          product.Quantity -= item.quantity;
          existingOrder.productList[existingProductIndex] = { ...item };
        } else {
          // Product is not in the order, add it
          if (product.Quantity < item.quantity) {
            return res.status(400).json({
              error: `${product.Name} has insufficient stock. Available: ${product.Quantity}`,
            });
          }

          product.Quantity -= item.quantity;
          existingOrder.productList.push({ ...item });
        }

        if (product.Quantity === 0) {
          product.inStock = false;
        }

        await product.save();
      }

      if (totalPrice) {
        existingOrder.totalPrice = totalPrice;
      }

      const updatedOrder = await existingOrder.save();

      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
