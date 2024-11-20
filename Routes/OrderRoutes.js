const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const auth = require("../Middlewares/Auth");
const Order = require("../Models/Order");
const Product = require("../Models/Product")


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

      const promisesResult = await Promise.all(productList.map(async (item) => {
        const productExist = await Product.findOne({ _id: item.productId });
        if (!productExist) {
          throw new Error(`product with productid: ${item.productId} not found`);
        }
        if (!productExist.inStock) {
          throw new Error(`${productExist.Name} is out of stock`)
        }

        if (productExist.Quantity < item.quantity) {
          throw new Error(`${productExist.Name} is in insufficient quantity. Available Quantity: ${productExist.Quantity}`)
        }


        return { "productId": item.productId, "quantity": item.quantity, status: true };
      }))

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

        })
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
    const orders = await Order.find().populate("productList.productId");

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    const ExistingOrder = await Order.findOne({_id});
    if (!ExistingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    ExistingOrder.productList.map(async (item) => {
      const product = await Product.findOne({ _id: item.productId });
      if (product) {
        product.Quantity += item.quantity;
        if (product.Quantity > 0) {
          product.inStock = true;
        }
        await product.save();
      }
    })
    ExistingOrder.deleteOne();
    res.status(200).json({ message: "Order Deleted" })


  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

module.exports = router;