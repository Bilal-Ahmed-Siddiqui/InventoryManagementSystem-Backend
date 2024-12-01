const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const path = require('path');
const CategoryRoutes = require("./Routes/CategoryRoutes");
const ProductRoutes = require("./Routes/ProductRoutes");
const UserRoutes = require("./Routes/UserRoutes");
const OrderRoutes = require("./Routes/OrderRoutes");
const app = express();

app.use(express.json());

localURL = "mongodb://localhost:27017/inventoryManagementSystem";
// AtlasURL = `mongodb+srv://bilalahmed:${process.env.DB_PASSWORD}@forteaching.plyfh.mongodb.net/?retryWrites=true&w=majority&appName=forTeaching`;

mongoose
  .connect(localURL)
  .then(() => {
    console.log("Db is connected");
  })
  .catch((err) => {
    console.log("some error occured", err);
  });

//example endpoint
app.get("/api", (req, res) => {
  res.send("end point is working");
});

//Routes
app.use("/category", CategoryRoutes);
app.use("/product", ProductRoutes);
app.use("/user", UserRoutes);
app.use("/order", OrderRoutes);

// Serve static files from the 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(300, () => {
  console.log("server is running on 300");
});
