import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../services/apiService';

const SignUp = () => {
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
      await apiService.signup(userData);
      navigate('/');
    } catch (error) {
      console.error('Sign up error', error);
      alert('Sign up failed');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        <input
          type="text"
          name="name"
          value={userData.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
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
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <Link to="/signin">Sign In</Link></p>
    </>
  );
};

export default SignUp;
