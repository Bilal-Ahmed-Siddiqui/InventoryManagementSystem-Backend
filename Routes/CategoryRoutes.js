const express = require("express");
const Category = require("../Models/Category")
const router = express.Router();

//create category endpoint
router.post("/create", async (req, res)=>{
    try {
        const {name} = req.body;
        const newCategory = new Category({name});
        const savedCategory = await newCategory.save();
        res.status(201).json(savedCategory);

        
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

module.exports = router