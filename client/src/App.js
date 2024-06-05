import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import Home from './components/Home';
import Callback from './components/Callback';
import apiService from './services/apiService';

const App = () => {
  const isAuthenticated = () => {
    return !!apiService.getCurrentUser();
  };

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/auth/callback" element={<Callback />} />
        <Route
          path="/"
          element={isAuthenticated() ? <Home /> : <Navigate to="/signin" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
