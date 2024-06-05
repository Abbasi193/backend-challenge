import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import apiService from '../services/apiService';

const SignUp = () => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
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
      await apiService.signup(userData);
      navigate('/');
    } catch (error) {
      console.error('Sign up error', error);
      alert('Sign up failed');
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
        <h2 className="form-title">Sign Up</h2>
        <div className="input-group">
          <input
            type="text"
            name="name"
            value={userData.name}
            onChange={handleChange}
            placeholder="Name"
            required
            className="input-field"
          />
        </div>
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
        <button type="submit" className="submit-button">Sign Up</button>
      </form>
      <p className="sign-in-link">
        Already have an account? <Link to="/signin">Sign In</Link>
      </p>
    </div>
  );
};

export default SignUp;
