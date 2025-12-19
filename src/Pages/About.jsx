import React from "react";
import { useNavigate } from "react-router-dom";
import "./css/About.css";
import donorimg from '../assets/donor-icon.png'
import reqimg from '../assets/requester-icon.png'
import icon1 from '../assets/icon1.png'
import icon2 from '../assets/icon2.png'
import icon3 from '../assets/icon3.png'
import icon4 from '../assets/icon4.png'
import icon5 from '../assets/icon5.png'
import icon6 from '../assets/icon6.png'


function About() {
   const navigate = useNavigate();
  return (
    <div className="about">
        <h1 className="title">How Donate2Save Works?</h1>
      <div className='top-content'>
        <div className="top-content-left">
         <img src={donorimg}></img>
         <h2>Become a Donor</h2>
         <p>Help people in emergencies, earn badges
          <br></br>
          and download donation certificates.</p>
          <button onClick={()=>navigate('/login')}>Join as Donor</button>
        </div>
        <div className="top-content-right">
          <img src={reqimg}></img>
          <h2>Need Blood</h2>
          <p>Create urgent requests, match with nearby
            <br></br>
            donors and track status in real time.</p>
          <button onClick={()=>navigate('/login')}>Request Blood</button>
        </div>
      </div>
      <h1 className="title">Unique Features</h1>
      <div className="bottom-content">
         <div className="row1">
          <div>
            <img src={icon1}></img>
            <h2>Emergency Match</h2>
            <p>Match your request with nearby donors in real time.</p>
         </div>
         <div>
            <img src={icon2}></img>
            <h2>Donation Certificates</h2>
            <p>Download certificates for your donations.</p>
         </div>
         <div>
            <img src={icon3}></img>
            <h2>Badge System</h2>
            <p>Earn badges for your contributions.</p>
         </div>
         </div>
         <div className="row2">
          <div>
            <img src={icon4}></img>
            <h2>Real-Time Tracking</h2>
            <p>Track the status of your request in real time.</p>
         </div>
         <div>
            <img src={icon5}></img>
            <h2>Urgent Requests</h2>
            <p>Create urgent requests for blood.</p>
         </div>
         <div>
            <img src={icon6}></img>
            <h2>Donor Profiles</h2>
            <p>View donor profiles and contact information.</p>
         </div>
         </div>
      </div>
    </div>
  );
}

export default About
