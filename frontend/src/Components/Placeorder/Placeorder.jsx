import React, { useContext, useState } from 'react';
import './Placeorder.css';
import { ShopContext } from '../../Context/ShopContext';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Placeorder = () => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate(); // Initialize useNavigate
    const [message, setMessage] = useState('');
    const { getTotalCartAmount, getcart } = useContext(ShopContext);

    const [data, setData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "",
        phone: ""
    });

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        const cardElement = elements.getElement(CardElement);

        // Check if cardElement is valid
        if (!cardElement) {
            setMessage("Card element not found!");
            return;
        }

        const response = await fetch('https://react-zfr1.onrender.com/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: getTotalCartAmount() * 100 }), // Amount in cents
        });

        const { clientSecret } = await response.json();

        const paymentResult = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement },
        });

        if (paymentResult.error) {
            setMessage(paymentResult.error.message);
        } else if (paymentResult.paymentIntent.status === 'succeeded') {
            setMessage('Payment successful!');
            console.log('Payment successful!');
            navigate('/order-success', { state: { orderData: data } }); // Redirect to success page
        }
    };

    const PlaceOrder = (e) => {
        e.preventDefault();
        let orderItems = [];
        getcart.forEach((item) => {
            if (item._id && item.quantity > 0) {
                let itemInfo = { ...item, quantity: item.quantity };
                orderItems.push(itemInfo);
            }
        });
        console.log('Order Items:', orderItems);
        console.log('User Data:', data);
    };

    return (
        <form onSubmit={PlaceOrder} className="place-order">
            <div className="place-order-left">
                <p className="title">Delivery Information</p>
                <div className="multi-fields">
                    <input name="firstName" onChange={onChangeHandler} value={data.firstName} type="text" placeholder="First Name" />
                    <input name="lastName" onChange={onChangeHandler} value={data.lastName} type="text" placeholder="Last Name" />
                </div>
                <input name="email" onChange={onChangeHandler} value={data.email} type="email" placeholder="Email address" />
                <input name="street" onChange={onChangeHandler} value={data.street} type="text" placeholder="Street" />
                <div className="multi-fields">
                    <input name="city" onChange={onChangeHandler} value={data.city} type="text" placeholder="City" />
                    <input name="state" onChange={onChangeHandler} value={data.state} type="text" placeholder="State" />
                </div>
                <div className="multi-fields">
                    <input name="pincode" onChange={onChangeHandler} value={data.pincode} type="text" placeholder="Pin Code" />
                    <input name="country" onChange={onChangeHandler} value={data.country} type="text" placeholder="Country" />
                </div>
                <input name="phone" onChange={onChangeHandler} value={data.phone} type="text" placeholder="Phone" />
            </div>

            <div className="place-order-right">
                <div className="cartitems-down">
                    <div className="cartitems-total">
                        <h1>Cart Totals</h1>
                        <div>
                            <div className="cartitems-total-item">
                                <p>Subtotal</p>
                                <p>${getTotalCartAmount()}</p>
                            </div>
                            <hr />
                            <div className="cartitems-total-item">
                                <p>Shipping Fee</p>
                                <p>Free</p>
                            </div>
                            <hr />
                            <div className="cartitems-total-item">
                                <h3>Total</h3>
                                <h3>${getTotalCartAmount()}</h3>
                            </div>
                        </div>
                        <CardElement />
                        <button type="button" onClick={handlePayment}>PROCEED TO PAYMENT</button>
                        {message && <div className="payment-message">{message}</div>}
                    </div>
                </div>
            </div>
        </form>
    );
};

export default Placeorder;
