const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../Models/User");
const router = express.Router();

//signup endpoint
router.post("/signup", async (req, res) => {
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
});

//login
router.post("/login", async(req, res)=>{
    try {
        const {email, password} = req.body;
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({message: "Invalid email or password"});
        }
        
        const CorrectPassword = await bcrypt.compare(password, user.password )
        if(!CorrectPassword){
            return res.status(400).json({message: "Invalid email or password"});
        }

        res.status(200).json({message: "login successful"})

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
})

module.exports = router;
