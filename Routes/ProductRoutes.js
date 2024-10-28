const express = require("express");
const Product = require("../Models/Product");
const router = express.Router();

//get all products

router.get("/getall", async (req, res)=>{
    try {
        const products = await Product.find();
          
        res.status(200).json(products)
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


module.exports = router;