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

//get all categories
router.get("/getAll", async (req, res)=>{
    try {
        const categories = await Category.find();
        if(!categories){
            return  res.status(404).json({error: "categories not found"})
         }

        res.status(200).json(categories)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

//get category by id categories
router.get("/:id", async (req, res)=>{
    try {

        const {id} = req.params;

        const category = await Category.findOne({_id: id});

        if(!category){
           return  res.status(404).json({error: "category not found"})
        }

        res.status(200).json(category)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})


module.exports = router