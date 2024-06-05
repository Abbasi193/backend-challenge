import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingScreen from './LoadingScreen';
import './signin.css';

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true)
      await apiService.signin(userData);
      navigate('/');
    } catch (error) {
      console.error('Sign in error', error);
      alert('Sign in failed');
    } finally {
      setLoading(false)
    }
  };
  if (loading) {
    return <LoadingScreen text="Loading..." />;
  }

  return (
    <div className="sign-in-container">
      <form className="sign-in-form" onSubmit={handleSubmit}>
        <h2 className="form-title">Sign In</h2>
        <div className="input-group">
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="input-field"
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="input-field"
          />
        </div>
        <button type="submit" className="submit-button">Sign In</button>
      </form>
      <p className="sign-up-link">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>

  );
};

export default SignIn;
