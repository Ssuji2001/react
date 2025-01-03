import React from 'react';
import './Navbar.css';
import navlogo from '../../assets/nav-logo.svg';


const Navbar = () => {
  return (
    <div className="navbar">
      <img src={navlogo} alt="Navigation Logo" className="nav-logo" />
      {/* Add additional elements or links for your Navbar as needed */}
    </div>
  );
};

export default Navbar;
