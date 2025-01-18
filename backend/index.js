const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();
const app = express();
const port = 3000;

app.use(express.json());

// CORS Configuration
app.use(
  cors({
    origin: "*", // Replace with your frontend's URL if needed
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useUnifiedTopology: true });
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

// Static Files for Images
app.use("/images", express.static(path.join(__dirname, "upload/images")));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "./upload/images";
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// Define BASE_URL dynamically
app.use((req, res, next) => {
  req.BASE_URL = `${req.protocol}://${req.get("host")}/images/`;
  next();
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

// User Schema
const Users = mongoose.model("Users", {
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  cartData: { type: Object },
  date: { type: Date, default: Date.now },
});

// Upload Image Endpoint
app.post("/upload", upload.single("product"), (req, res) => {
  const imageUrl = `${req.BASE_URL}${req.file.filename}`;
  res.json({ success: 1, image_url: imageUrl });
});

// Add Product
app.post("/addproduct", async (req, res) => {
  const products = await Product.find({});
  const id = products.length > 0 ? products.slice(-1)[0].id + 1 : 1;

  const product = new Product({
    id,
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

// Get All Products
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  const BASE_URL = req.BASE_URL;
  products = products.map((product) => ({
    ...product.toObject(),
    image: product.image.startsWith("http") ? product.image : `${BASE_URL}${product.image}`,
  }));
  res.json(products);
});

// Other Endpoints
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
