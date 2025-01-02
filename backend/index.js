const port = 3000; 
const express = require("express");
const fs = require("fs");

const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const Stripe = require('stripe');

app.use(express.json());
app.use(cors());
const stripe = Stripe('sk_test_51Qb44oC8ftaxme9o8Wg19FNBZoBz75VSwjfJTzB4o25dipvd4PuFJkisQTOJTHE4p5O9qLTvO0dz1dKHFl5WN4cc00jyiEcwjK');
// MongoDB connection
mongoose.connect(
  "mongodb+srv://sujisakthi2005:yOD3ZXY3R0SJmSyH@cluster0.ufwwm.mongodb.net/"
).then(() => {
  console.log("MongoDB connected");
}).catch((error) => {
  console.error("Error connecting to MongoDB:", error);
});

// Ensure the upload directory exists
const uploadPath = "./upload/images";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// API Creation
app.get("/", (req, res) => {
  res.send("Express App is Running");
});

// Image Storage Engine
const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File upload middleware
const upload = multer({ storage: storage });

// Serve static files
app.use("/images", express.static(uploadPath));

// Creating Upload Endpoint for Images
app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: 0, message: "No file uploaded" });
  }
  const image_url = `http://localhost:${port}/images/${req.file.filename}`;
  res.json({
    success: 1,
    image_url: image_url,
  });
});



//Schema for  creating Products

const Product = mongoose.model("Product",{
  id:{
    type:Number,
    required:true,
  },
  name:{
    type:String,
    required:true,
  },
  image:{
    type:String,
    required:true,
  },
  category:{
    type:String,
    required:true,
  },
  new_price:{
    type:Number,
    required:true,
  },
  old_price:{
    type:Number,
    required:true,
  },
  date:{
    type:Date,
    default:Date.now,
  },
  available:{
    type:Boolean,
    default:true,
  },


})

app.post('/addproduct',async (req,res)=>{
  let products = await Product.find({});
  let id;
  if(products.length>0)
  {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id+1;
  }
  else{
    id=1;
  }
  const product = new Product ({
    id:id,
    name:req.body.name,
    image:req.body.image,
    category:req.body.category,
    new_price:req.body.new_price,
    old_price:req.body.old_price,
  });

  console.log(product);
  await product.save();
  console.log("saved");
  res.json({
    success:true,
    name:req.body.name,
  })
})

//craeating api for deleting product

app.post('/removeproduct',async (req,res)=>{
  await Product.findOneAndDelete({id:req.body.id});
  console.log("Removed");
  res.json({
    success:true,
    name:req.body.name
  })
})

//creating api for getting all products
app.get('/allproducts', async(req,res)=>{
  let products = await Product.find({});
  console.log("All products fetched");
  res.send(products);
})

//Schema creating for User Model

const Users = mongoose.model('Users',{
  name:{
    type:String,
  },
  email:{
    type:String,
    unique:true,
  },
  password:{
    type:String,
  },
  cartData:{
    type:Object,
  },
  date:{
    type:Date,
    default:Date.now,
  }

})

//creating endpoint for registering the user

app.post('/signup',async(req,res)=>{

  let check = await Users.findOne({email:req.body.email});
  if(check){
    return res.status(400).json({success:false,errors:"existing user found with same email address"})
  }
  let cart = {};
  for (let i = 0; i < 300; i++) {
   cart[i]=0;
    
  }

  const user = new Users({
    name:req.body.username,
    email:req.body.email,
    password:req.body.password,
    cartData:cart,
  })

  await user.save();

  const data={
    user:{
      id:user.id
    }
  }

  const token = jwt.sign(data,'secret_ecom');
  res.json({success:true,token})

})

//creating endpoint for user login
app.post('/login',async (req,res)=>{
  let user = await Users.findOne({email:req.body.email});
  if(user){
    const passCompare = req.body.password === user.password;
    if(passCompare){
      const data = {
        user:{
          id:user.id
        }
      }
      const token = jwt.sign(data,'secret_ecom');
      res.json({success:true,token});
    }
    else{
      res.json({success:false,errors:"Wrong Password"})
    }
  }
  else{
    res.json({success:false,errors:"Wrong Email Id"})
  }
})

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




// Start the server
app.listen(port, (error) => {
  if (!error) {
    console.log("Server Running on Port " + port);
  } else {
    console.log("Error :" + error);
  }
});
