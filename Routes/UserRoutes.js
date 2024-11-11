const express = require("express");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const router = express.Router();

const JWT_SECRET = "Mysecret"

//signup endpoint
router.post(
  "/signup",
  [
    body("username")
      .notEmpty()
      .isString()
      .isLength({ min: 5 })
      .withMessage("username is required, atleast 5 characters long"),
    body("email")
      .notEmpty()
      .isEmail()
      .withMessage("email should be in email format"),
    body("password")
      .notEmpty()
      .isLength({ min: 8 })
      .withMessage("password atleast contain 8 characters long"),
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error });
    }
    try {
      const { username, email, password } = req.body;

      const alreadyExist = await User.findOne({ email });

      if (alreadyExist) {
        return res
          .status(409)
          .json({ message: "User with this email already exists" });
      }
      //hash
      const salt = await bcrypt.genSalt(5);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({ username, email, password: hashedPassword });
      const savedUser = await newUser.save();

      return res.status(201).json(savedUser);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

//login
router.post("/login",
[
  body("email")
    .notEmpty()
    .isEmail()
    .withMessage("email should be in email format"),
  body("password")
    .notEmpty()
    .withMessage("password is reqruied"),
], async (req, res) => {
  const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error });
    }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const CorrectPassword = await bcrypt.compare(password, user.password);
    if (!CorrectPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = await jwt.sign({ id: user._id }, JWT_SECRET);

    res.status(200).json({ token: token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
