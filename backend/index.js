const port = 3000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET"],
    credentials: true,
  })
);

const dotenv = require("dotenv");

// Load environment variables
dotenv.config(); // Ensure .env is in the root directory

// Debug log for MONGO_URI
console.log("MONGO_URI:", process.env.MONGO_URI);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit process with failure
  }
};

// Connect to the database
connectDB();

// API creation
app.get("/", (req, res) => {
  res.send("Express App is Running");
});

// Image Storage Engine
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    const productId = req.body.id; // Ensure `id` is sent in the request body
    const filename = `product_${productId}${path.extname(file.originalname)}`;
    return cb(null, filename);
  },
});

const upload = multer({ storage: storage });

// Serve static files
app.use("/images", express.static(path.join(__dirname, "upload/images")));

// Fallback for missing images
app.get("/images/:filename", (req, res) => {
  const filePath = path.join(__dirname, "upload/images", req.params.filename);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If file does not exist, send a fallback image
      res.sendFile(path.join(__dirname, "upload/images", "default.jpg"));
    } else {
      res.sendFile(filePath);
    }
  });
});

// Upload image
app.post("/upload", upload.single("product"), (req, res) => {
  const productId = req.body.id;
  const imageUrl = `${req.protocol}://${req.get("host")}/images/product_${productId}${path.extname(
    req.file.originalname
  )}`;
  res.json({
    success: 1,
    image_url: imageUrl,
  });
});

// Schema for Creating Products
const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

// Add product
app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id = products.length > 0 ? products.slice(-1)[0].id + 1 : 1;

  const product = new Product({
    id: id,
    name: req.body.name,
    image: `product_${id}.jpg`, // Store image filename
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });

  await product.save();
  console.log("Product Saved");
  res.json({
    success: true,
    product,
  });
});

// Delete product
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Get all products
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  let updatedProducts = products.map((product) => {
    return {
      id: product.id,
      name: product.name,
      imageUrl: `${req.protocol}://${req.get("host")}/images/product_${product.id}.jpg`, // Adjust file extension
      category: product.category,
      new_price: product.new_price,
      old_price: product.old_price,
      available: product.available,
    };
  });
  console.log("All Products Fetched");
  res.send(updatedProducts);
});

// Other endpoints (signup, login, cart management, etc.) remain unchanged

app.listen(port, (error) => {
  if (!error) {
    console.log("Server Running on Port " + port);
  } else {
    console.log("Error : " + error);
  }
});
