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

const User = mongoose.model("User", {
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cartData: {
    type: Map,  // Map for storing keys as product IDs and values as quantities
    of: Number, // The value type is Number (for product quantities)
    default: () => {
      const cart = {};
      for (let i = 0; i < 300; i++) {
        cart[i] = 0;  // Set initial quantity to 0 for each product ID
      }
      return cart;
    }
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

app.get("/", (req, res) => {
  res.send("Express App is Running");
});

// Image Storage Engine
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
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
    console.log("User registered:", { username, email });
    res.json({ success: true, message: "Signup successful!" });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ success: false, message: "Signup failed.", error });
  }
});
let cart = {};
for (let i = 0; i < 300; i++) {
  cart[i] = 0;
}

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
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Login failed.", error });
  }
});

//creating endpoint for newcollection data
app.get('/newcollections',async (req,res)=>{
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("NewCollection Fetched");
  res.send(newcollection);
})

//cretaing endpoint for popular in women section
app.get('/popularinwomen',async(req,res)=>{
  let products = await Product.find({category:"women"});
  let popular_in_women = products.slice(0,4);
  console.log("Popular in women fetched");
  res.send(popular_in_women);
})
const fetchUser = async (req, res, next) => {
  const token = req.header('auth-token');
  
  if (!token) {
    return res.status(401).send({ errors: "Authentication token is missing. Please provide a valid token." });
  }

  try {
    // Verify the token and attach user data to the request
    const data = jwt.verify(token, 'secret_ecom');
    req.user = data.user;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Token verification error:", error.message);
    res.status(401).send({ errors: "Invalid authentication token. Please login again." });
  }
};


//creating endpoint for adding products in cartdata
app.post('/addtocart', fetchUser, async (req, res) => {
  try {
    // Validate itemId
    const itemId = req.body.itemId;
    if (!itemId) {
      return res.status(400).send({ error: "Item ID is required" });
    }

    // Fetch user data
    const userData = await Users.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).send({ error: "User not found" });
    }

    // Ensure cartData exists
    if (!userData.cartData) {
      userData.cartData = {};
    }

    // Increment item count or initialize to 1
    userData.cartData[itemId] = (userData.cartData[itemId] || 0) + 1;

    // Save changes
    userData.markModified('cartData'); // Ensure Mongoose detects changes
    await userData.save();

    res.send("Added");
  } catch (error) {
    console.error("Error updating cart:", error.message);
    res.status(500).send({ error: "Internal server error" });
  }
});  


//creating endpoint for removing products in cartdata
app.post('/removefromcart', fetchUser, async (req, res) => {
  try {
    // Validate itemId
    const itemId = req.body.itemId;
    if (!itemId) {
      return res.status(400).send({ error: "Item ID is required" });
    }

    // Fetch user data
    const userData = await Users.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).send({ error: "User not found" });
    }

    // Ensure cartData exists
    if (!userData.cartData) {
      userData.cartData = {};
    }

    // Increment item count or initialize to 1
    userData.cartData[itemId] = (userData.cartData[itemId] || 0) - 1;

    // Save changes
    userData.markModified('cartData'); // Ensure Mongoose detects changes
    await userData.save();

    res.send("Removed");
  } catch (error) {
    console.error("Error updating cart:", error.message);
    res.status(500).send({ error: "Internal server error" });
  }
});  

app.post('/removeonefromcart', fetchUser, async (req, res) => {
  try {
    // Validate itemId
    const itemId = req.body.itemId;
    if (!itemId) {
      return res.status(400).send({ error: "Item ID is required" });
    }

    // Fetch user data
    const userData = await Users.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).send({ error: "User not found" });
    }

    // Ensure cartData exists
    if (!userData.cartData) {
      userData.cartData = {};
    }

    // Increment item count or initialize to 1
    userData.cartData[itemId] = (userData.cartData[itemId] || 0) - 1;

    // Save changes
    userData.markModified('cartData'); // Ensure Mongoose detects changes
    await userData.save();

    res.send("Removed");
  } catch (error) {
    console.error("Error updating cart:", error.message);
    res.status(500).send({ error: "Internal server error" });
  }
});  
//creating endpoint for get products in cartdata
app.post('/getcart', fetchUser, async (req, res) => {
  console.log("Getcart");
  let userData = await Users.findOne({_id:req.user.id});
  res.json(userData.cartData);
});




// Start the Server
app.listen(port, (error) => {
  if (!error) {
    console.log("Server Running on Port " + port);
  } else {
    console.log("Error : " + error);
  }
});
