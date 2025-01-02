import React from 'react';
import { useLocation } from 'react-router-dom';
import './OrderSuccess.css'
import tick_icon from '../../assets/teenyicons--tick-circle-solid.svg'

const OrderSuccess = () => {
    const location = useLocation();
    const orderData = location.state?.orderData;

    if (!orderData) {
        return <p>No order data available. Please go back and place an order.</p>;
    }

    return (
        <div className="order-success-container">
            <div className="tick-container">
              
                <img src={tick_icon} alt="Success" className="tick-image" />
            </div>
            <h1>Order Successful!</h1>
            <p>Thank you for your order, {orderData.firstName}!</p>
            <p>Your order details have been sent to {orderData.email}.</p>
        </div>
    );
};

export default OrderSuccess;
