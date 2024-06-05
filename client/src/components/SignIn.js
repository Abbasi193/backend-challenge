import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../services/apiService';

const SignIn = () => {
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
      await apiService.signin(userData);
      navigate('/');
    } catch (error) {
      console.error('Sign in error', error);
      alert('Sign in failed');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h2>Sign In</h2>
        <input
          type="email"
          name="email"
          value={userData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <input
          type="password"
          name="password"
          value={userData.password}
          onChange={handleChange}
          placeholder="Password"
          required
        />
        <button type="submit">Sign In</button>
      </form>
      <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
    </>

  );
};

export default SignIn;
