const port = 3000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());

// Replace with your frontend URL
app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET"],
    credentials: true,
  })
);

// Database Connection with MongoDB
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

app.get("/", (req, res) => {
  res.send("Express App is Running");
});

// Image Storage Engine
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

// Serving Static Images
app.use("/images", express.static(path.join("upload/images")));

// Upload Endpoint for Images
app.post("/upload", upload.single("product"), (req, res) => {
  const imageUrl = `${req.protocol}://${req.get("host")}/images/${req.file.filename}`;
  res.json({
    success: 1,
    image_url: imageUrl,
  });
});

// Product Schema
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

// Add Product
app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id = products.length > 0 ? products.slice(-1)[0].id + 1 : 1;

  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });

  await product.save();
  res.json({ success: true, name: req.body.name });
});

// Remove Product
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  res.json({ success: true });
});

// Base URL for Images
const BASE_URL = "https://yourdomain.com"; // Replace with your actual domain

// Get All Products
app.get("/allproducts", async (req, res) => {
 
  let products = await Product.find({});
  products = products.map((product) => ({
    ...product.toObject(),
    image: product.image.startsWith("http") ? product.image : `${BASE_URL}${product.image}`,
  }));
  res.json(products);
});
app.post('/create-payment-intent', (req, res) => {
  try {
      // Your payment intent logic here
      res.json({ success: true });
  } catch (error) {
      console.error('Error in /create-payment-intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
  }

  // Dummy login logic (replace with actual validation logic)
  if (username === 'testuser' && password === 'password123') {
      res.json({ token: 'your-jwt-token' }); // Return a fake token
  } else {
      res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Signup route
app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
  }

  // Handle signup logic here (e.g., save user to database)
  console.log('New user signup:', { username, password });

  res.json({ message: "Signup successful!" });
});

// The rest of your code for Users and other endpoints remains unchanged...

app.listen(port, (error) => {
  if (!error) {
    console.log("Server Running on Port " + port);
  } else {
    console.log("Error : " + error);
  }}
);