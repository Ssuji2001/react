const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Enable JSON parsing
app.use(express.json());

// CORS Configuration
app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET"],
    credentials: true,
  })
);

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

connectDB();

// User Schema and Model
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

// Product Schema and Model
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

// Home Route
app.get("/", (req, res) => {
  res.send("Express App is Running");
});

// Image Storage Engine
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Static File Serving for Images
app.use("/images", express.static(path.join(__dirname, "upload/images")));

// Upload Endpoint for Images
app.post("/upload", upload.single("product"), (req, res) => {
  const imageUrl = `${req.protocol}://${req.get("host")}/images/${req.file.filename}`;
  res.json({
    success: 1,
    image_url: imageUrl,
  });
});

// Add Product Endpoint
app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id = products.length > 0 ? products.slice(-1)[0].id + 1 : 1;

  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image, // Ensure this is a valid URL or path
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });

  await product.save();
  res.json({ success: true, name: req.body.name });
});

// Get All Products Endpoint
app.get("/allproducts", async (req, res) => {
  const products = await Product.find({});
  const formattedProducts = products.map((product) => ({
    ...product.toObject(),
    image: product.image.startsWith("http")
      ? product.image
      : `${req.protocol}://${req.get("host")}/images/${product.image}`,
  }));
  res.json(formattedProducts);
});

// Remove Product Endpoint
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  res.json({ success: true });
});

// Signup Endpoint
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    const user = new User({ username, email, password });
    await user.save();
    res.json({ success: true, message: "Signup successful!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Signup failed.", error });
  }
});

// Login Endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ email: user.email }, "your_jwt_secret", { expiresIn: "1h" });
    res.json({ success: true, message: "Login successful!", token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Login failed.", error });
  }
});

// Start the Server
app.listen(port, (error) => {
  if (!error) {
    console.log(`Server Running on Port ${port}`);
  } else {
    console.error("Error:", error);
  }
});
