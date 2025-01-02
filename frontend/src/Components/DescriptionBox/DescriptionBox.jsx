import React from 'react'
import './DescriptionBox.css'

const DescriptionBox = () => {
  return (
   <div className='descriptionbox'>
    <div className='descriptionbox-navigator'>
        <div className='descriptionbox-nav-box'>Description</div>
        <div className='descriptionbox-nav-box fade'>Reviews (122)</div>
    </div>
    <div className='descriptionbox-description'>
        <p>An e-commerce website is a online platform that faciliate buying and selling of productss or services over the internet serves as a virtual marketplace where buisnesses and individual showcase their products,
            interact with customers, and conduct transactions without the need for a physical presence. E-commerce websites have gained immense popularity due to their convenience, accessibility, and the global reach they offer.
        </p>
        <p>
            E-commerce websites typically display products or services a detailed description, images, prices, and any available variable(e.g., sizes, colors). Each product usually has its own dedicated with relevant information.
        </p>
    </div>
   </div>
  )
}

export default DescriptionBox