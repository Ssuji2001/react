const port =3000;
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
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // Dummy user data for testing (replace this with your database logic)
  const user = {
    email: 'test@example.com',
    password: 'password123', // In production, never store plain-text passwords
  };

  if (email === user.email && password === user.password) {
    // Generate a token for the user (using JWT, for example)
    const token = jwt.sign({ email }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ success: true, message: 'Login successful!', token });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Simulate saving to a database (example)
  console.log('User registered:', { username, email, password });
  res.json({ success: true, message: 'Signup successful!' });
});


app.listen(port, (error) => {
  if (!error) {
    console.log("Server Running on Port " + port);
  } else {
    console.log("Error : " + error);
  }}
);