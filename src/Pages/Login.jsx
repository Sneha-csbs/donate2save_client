import React, { useState } from "react";
import {Link,useNavigate} from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import "./css/Login.css";

export default function Login() {
  const navigate=useNavigate();
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState("login"); 
  const [signupRole, setSignupRole] = useState("donor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); 

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    
    bloodGroup: "",
    dob: "",
    lastDonation: "",
    city: "",
    pincode: "",
    
    hospitalName: "",
    regNumber: "",
    hospitalAddress: "",
    contactPerson: "",
  });

  
  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    if (!loginForm.email || !loginForm.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }
    
    try {
      const result = await login(loginForm.email, loginForm.password);
      
      if (result.success) {
        // Navigate based on user role
        if (result.user.role === "donor") {
          navigate("/DonorDashBoard");
        } else if (result.user.role === "admin") {
          navigate("/AdminDashBoard");
        } else {
          navigate("/RequesterDashBoard");
        }
      } else {
        setError(result.message || "Login failed");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    
    try {
      const userData = {
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        role: signupRole,
        city: signupForm.city,
      };
      
      if (signupRole === "donor") {
        userData.bloodGroup = signupForm.bloodGroup;
        userData.phone = signupForm.phone;
      } else {
        userData.orgName = signupForm.hospitalName;
        userData.contact = signupForm.contactPerson;
      }
      
      const result = await register(userData);
      
      if (result.success) {
        // Navigate based on user role
        if (result.user.role === "donor") {
          navigate("/DonorDashBoard");
        } else {
          navigate("/RequesterDashBoard");
        }
      } else {
        setError(result.message || "Registration failed");
      }
    } catch (error) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        
        <div className="auth-left">
          <div className="auth-brand">
            <span className="auth-brand-text">Donate2Save</span>
          </div>
          <h1 className="auth-heading">Connect. Donate. Save Lives.</h1>
          <p className="auth-sub">
            Access smart emergency matching, donor certificates and real-time
            tracking from one secure dashboard.
          </p>
          <ul className="auth-highlight-list">
            <li>Verified donors & hospitals</li>
            <li>Role-based dashboards (Donor / Requester / Admin)</li>
            <li>Downloadable reports & certificates</li>
          </ul>
        </div>

        
        <div className="auth-right">
          
          <div className="auth-tabs">
            <button
              className={
                "auth-tab" + (activeTab === "login" ? " auth-tab--active" : "")
              }
              onClick={() => setActiveTab("login")}
            >
              Log In
            </button>
            <button
              className={
                "auth-tab" + (activeTab === "signup" ? " auth-tab--active" : "")
              }
              onClick={() => setActiveTab("signup")}
            >
              Sign Up
            </button>
          </div>

          {activeTab === "login" ? (
            <form className="auth-form" onSubmit={submitLogin}>
              <h2 className="form-title">Log in to Donate2Save</h2>
              {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  required
                />
              </label>

              <label className="form-field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                  minLength={8}
                />
              </label>


              <button type="submit" className="btn-primary-auth" disabled={loading}>
                {loading ? "Logging in..." : "Log In"}
              </button>

              <p className="form-footer-text">
                New to Donate2Save?{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setActiveTab("signup")}
                >
                  Create an account
                </button>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submitSignup}>
              <h2 className="form-title">Create your account</h2>
              {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}

              
              <div className="role-toggle">
                <button
                  type="button"
                  className={
                    "role-chip" +
                    (signupRole === "donor" ? " role-chip--active" : "")
                  }
                  onClick={() => setSignupRole("donor")}
                >
                  I am a Donor
                </button>
                <button
                  type="button"
                  className={
                    "role-chip" +
                    (signupRole === "requester" ? " role-chip--active" : "")
                  }
                  onClick={() => setSignupRole("requester")}
                >
                  I am a Requester / Hospital
                </button>
              </div>

              
              <div className="form-grid-two">
                <label className="form-field">
                  <span>Full name</span>
                  <input
                    type="text"
                    name="name"
                    value={signupForm.name}
                    onChange={handleSignupChange}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    value={signupForm.email}
                    onChange={handleSignupChange}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Phone</span>
                  <input
                    type="tel"
                    name="phone"
                    value={signupForm.phone}
                    onChange={handleSignupChange}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>City</span>
                  <input
                    type="text"
                    name="city"
                    value={signupForm.city}
                    onChange={handleSignupChange}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Password</span>
                  <input
                    type="password"
                    name="password"
                    value={signupForm.password}
                    onChange={handleSignupChange}
                    required
                    minLength={8}
                  />
                  <small className="helper-text">
                    At least 8 characters, with a number or symbol.
                  </small>
                </label>

                <label className="form-field">
                  <span>Confirm password</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={signupForm.confirmPassword}
                    onChange={handleSignupChange}
                    required
                  />
                </label>
              </div>

              
              {signupRole === "donor" ? (
                <div className="role-section">
                  <h3 className="role-section-title">Donor details</h3>
                  <div className="form-grid-three">
                    <label className="form-field">
                      <span>Blood group</span>
                      <select
                        name="bloodGroup"
                        value={signupForm.bloodGroup}
                        onChange={handleSignupChange}
                        required
                      >
                        <option value="">Select</option>
                        <option>A+</option>
                        <option>A-</option>
                        <option>B+</option>
                        <option>B-</option>
                        <option>O+</option>
                        <option>O-</option>
                        <option>AB+</option>
                        <option>AB-</option>
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Date of birth</span>
                      <input
                        type="date"
                        name="dob"
                        value={signupForm.dob}
                        onChange={handleSignupChange}
                        required
                      />
                    </label>

                    <label className="form-field">
                      <span>Last donation date</span>
                      <input
                        type="date"
                        name="lastDonation"
                        value={signupForm.lastDonation}
                        onChange={handleSignupChange}
                      />
                    </label>
                  </div>

                  <label className="form-field">
                    <span>Pincode</span>
                    <input
                      type="text"
                      name="pincode"
                      value={signupForm.pincode}
                      onChange={handleSignupChange}
                      required
                    />
                  </label>

                  <p className="consent-text">
                    By signing up as a donor, you agree that your blood group
                    and availability may be shared with verified hospitals and
                    requesters for genuine medical needs only.
                  </p>
                </div>
              ) : (
                <div className="role-section">
                  <h3 className="role-section-title">Hospital / Requester details</h3>
                  <div className="form-grid-two">
                    <label className="form-field">
                      <span>Hospital / Organization name</span>
                      <input
                        type="text"
                        name="hospitalName"
                        value={signupForm.hospitalName}
                        onChange={handleSignupChange}
                        required
                      />
                    </label>

                    <label className="form-field">
                      <span>Registration / License number</span>
                      <input
                        type="text"
                        name="regNumber"
                        value={signupForm.regNumber}
                        onChange={handleSignupChange}
                        required
                      />
                    </label>

                    <label className="form-field">
                      <span>Contact person</span>
                      <input
                        type="text"
                        name="contactPerson"
                        value={signupForm.contactPerson}
                        onChange={handleSignupChange}
                        required
                      />
                    </label>
                  </div>

                  <label className="form-field">
                    <span>Hospital address</span>
                    <textarea
                      name="hospitalAddress"
                      rows={2}
                      value={signupForm.hospitalAddress}
                      onChange={handleSignupChange}
                      required
                    />
                  </label>

                  <p className="consent-text">
                    By creating a requester account, you confirm that all blood
                    requests made through Donate2Save will be genuine and
                    medically necessary.
                  </p>
                </div>
              )}

              <label className="checkbox-field checkbox-bottom">
                <input type="checkbox" required />
                <span>
                  I agree to the Terms and Privacy Policy.
                </span>
              </label>

              <button type="submit" className="btn-primary-auth" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>

              <p className="form-footer-text">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setActiveTab("login")}
                >
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
