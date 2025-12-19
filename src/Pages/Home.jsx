import React,{ useState } from 'react'
import './css/Home.css'
import image from '../assets/home-img.png'

const Home = () => {
  const [stats, setStats] = useState({
    donors: "50+",
    lives: "110",
    hospitals: "20",
    successRate: "90%",
  });
  return (
    <div className='home'>
    <div className='home-content'>
      <div className='left-content'>
        <div >
          <h1 className='q1'>Find Donors.
            <br></br>
            Save Lives.
            <br></br>
            Instantly.
          </h1>
          <p className='q2'>A smart, real-time platform connecting 
            <br></br>blood donors and patients when it matters most.</p>
        </div>
      </div>
      <div className='right-content'>
         <img src={image} className='home-img'></img>
         <ul className="trust-list" aria-hidden>
            <li>✔ Verified donors</li>
            <li>✔ Secure platform</li>
            <li>✔ Instant alerts</li>
          </ul>
      </div>
      </div>
      <div>
      <section className="stats">
        <div className="stat">
          <div className="stat-number">{stats.donors}</div>
          <div className="stat-label">Donors Registered</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.lives}</div>
          <div className="stat-label">Lives Saved</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.hospitals}</div>
          <div className="stat-label">Hospitals Connected</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.successRate}</div>
          <div className="stat-label">Emergency Match Rate</div>
        </div>
      </section>
      </div>
    </div>
  )
}

export default Home