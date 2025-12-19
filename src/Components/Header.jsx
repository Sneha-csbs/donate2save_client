import React from 'react'
import './css/Header.css'
import image from '../assets/logo-donate2save.png'
import {Link} from 'react-router-dom'

const Header = () => {
  return (
    <div className='header'>
      <img src={ image } className='logo'></img>
      <ul className='header-items'>
        <Link to='/'><li>Home</li></Link>
        <Link to='/about'><li>About</li></Link>
        <Link to='/login'><li className='ls'>Login/Signup</li></Link>
      </ul>
    </div>
  )
}

export default Header