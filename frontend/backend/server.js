const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Define the `/create-payment-intent` route
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
    });

    // Include additional data, such as a redirect URL or order ID
    res.json({ 
      clientSecret: paymentIntent.client_secret, 
      redirectUrl: '/success', // Example
      orderId: '12345' // Example order ID
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
