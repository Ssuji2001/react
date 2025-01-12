import React, { createContext, useEffect, useState } from 'react';

export const ShopContext = createContext(null);

// Default cart function
const getDefaultCart = () => {
    let cart = {};
    for (let index = 0; index < 300 + 1; index++) {
        cart[index] = 0; 
    }
    return cart;
}

const ShopContextProvider = (props) => {
    const [all_product, setAll_Product] = useState([]);
    const [cartItems, setCartItems] = useState(getDefaultCart());

    // Fetch products and cart data on component mount
    useEffect(() => {
        fetch('https://react-zfr1.onrender.com/allproducts')
            .then((response) => response.json())
            .then((data) => setAll_Product(data));

        // Fetch cart data only if user is authenticated
        if (localStorage.getItem('auth-token')) {
            fetch('https://react-zfr1.onrender.com/getcart', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',  // Fixed typo here
                    'auth-token': `${localStorage.getItem('auth-token')}`,
                    'Content-Type': 'application/json',  // Fixed typo here
                },
                body: JSON.stringify({}),  // Empty body or adjust it as needed for your backend
            })
            .then((response) => response.json())
            .then((data) => setCartItems(data))
            .catch((error) => console.error('Error fetching cart:', error));  // Added error handling for getcart
        }
    }, []);

    // Add item to the cart (by itemId)
    const addToCart = (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));

        if (localStorage.getItem('auth-token')) {
            fetch('https://react-zfr1.onrender.com/addtocart', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'auth-token': localStorage.getItem('auth-token'),
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ itemId }),
              })
                .then((response) => {
                  if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                  }
                  return response.json();
                })
                .then((data) => console.log(data))
                .catch((error) => console.error('Error adding to cart:', error));
              
    };
}

    // Remove one item from the cart (by itemId)
    const removeFromCart = (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) - 1 }));

        if (localStorage.getItem('auth-token')) {
            fetch('https://react-zfr1.onrender.com/removefromcart', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'auth-token': localStorage.getItem('auth-token'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ itemId }),
            })
                .then((response) => response.text())  // Assuming backend sends plain text
                .then((data) => console.log(data))  // Log response from backend
                .catch((error) => console.error('Error removing from cart:', error));  // Handle errors
        } else {
            console.warn('User is not authenticated');
        }
    };
    const removeOneFromCart = (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) - 1 }));

        if (localStorage.getItem('auth-token')) {
            fetch('https://react-zfr1.onrender.com/removefromcart', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'auth-token': localStorage.getItem('auth-token'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ itemId }),
            })
                .then((response) => response.text())  // Assuming backend sends plain text
                .then((data) => console.log(data))  // Log response from backend
                .catch((error) => console.error('Error removing from cart:', error));  // Handle errors
        } else {
            console.warn('User is not authenticated');
        }
    };

    // Get total cart amount
    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = all_product.find((product) => product.id === Number(item));
                if (itemInfo) {
                    totalAmount += itemInfo.new_price * cartItems[item];
                } else {
                    console.warn(`Product with id ${item} not found in all_product array.`);
                }
            }
        }
        return totalAmount;
    };

    // Get total number of items in cart
    const getTotalCartItems = () => {
        let totalItem = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                totalItem += cartItems[item];
            }
        }
        return totalItem;
    };

    // Provide values to the context
    const contextValue = { getTotalCartItems, getTotalCartAmount, all_product, cartItems, addToCart, removeFromCart,removeOneFromCart };

    return (
        <ShopContext.Provider value={contextValue}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;
