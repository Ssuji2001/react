const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());

// CORS Configuration
app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET"],
    credentials: true,
  })
);

// MongoDB Connection
const dotenv = require("dotenv");
dotenv.config();
console.log("MONGO_URL:", process.env.MONGO_URI);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

connectDB();

// User Model
const User = mongoose.model("User", {
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cartData: {
    type: Map,
    of: Number,
    default: () => {
      const cart = {};
      for (let i = 0; i < 300; i++) {
        cart[i] = 0;
      }
      return cart;
    },
  },
  date: { type: Date, default: Date.now },
});

// Product Model
const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});

// Middleware for Token Verification
const fetchUser = async (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).send({ errors: "Authentication token is missing. Please provide a valid token." });
  }

  try {
    const data = jwt.verify(token, 'your_jwt_secret');
    req.user = data;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    res.status(401).send({ errors: "Invalid authentication token. Please login again." });
  }
};

// Routes

// Add to Cart
app.post('/addtocart', fetchUser, async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).send({ error: "Item ID is required" });
    }

    const userData = await User.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).send({ error: "User not found" });
    }

    if (!userData.cartData) {
      userData.cartData = {};
    }

    userData.cartData[itemId] = (userData.cartData[itemId] || 0) + 1;
    userData.markModified('cartData'); // Ensure Mongoose detects changes
    await userData.save();

    res.send("Item added to cart");
  } catch (error) {
    console.error("Error updating cart:", error.message);
    res.status(500).send({ error: "Internal server error" });
  }
});

// Remove from Cart
app.post('/removefromcart', fetchUser, async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).send({ error: "Item ID is required" });
    }

    const userData = await User.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).send({ error: "User not found" });
    }

    if (!userData.cartData) {
      userData.cartData = {};
    }

    userData.cartData[itemId] = (userData.cartData[itemId] || 0) - 1;
    userData.markModified('cartData'); // Ensure Mongoose detects changes
    await userData.save();

    res.send("Item removed from cart");
  } catch (error) {
    console.error("Error removing from cart:", error.message);
    res.status(500).send({ error: "Internal server error" });
  }
});

// Remove One Item from Cart
app.post('/removeonefromcart', fetchUser, async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).send({ error: "Item ID is required" });
    }

    const userData = await User.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).send({ error: "User not found" });
    }

    if (!userData.cartData) {
      userData.cartData = {};
    }

    userData.cartData[itemId] = Math.max(0, (userData.cartData[itemId] || 0) - 1); // Prevent negative quantities
    userData.markModified('cartData'); // Ensure Mongoose detects changes
    await userData.save();

    res.send("One item removed from cart");
  } catch (error) {
    console.error("Error removing one from cart:", error.message);
    res.status(500).send({ error: "Internal server error" });
  }
});

// Get Cart Data
app.post('/getcart', fetchUser, async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).send({ error: "User not found" });
    }

    res.json(userData.cartData);
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    res.status(500).send({ error: "Internal server error" });
  }
});

// Start the Server
app.listen(port, (error) => {
  if (!error) {
    console.log("Server Running on Port " + port);
  } else {
    console.log("Error : " + error);
  }
});
