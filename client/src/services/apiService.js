import axios from 'axios';

export const API_URL = 'http://localhost:4000';

const connect = async (data) => {
  const response = await axios.post(`${API_URL}/auth/connect`, data, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.data;
};

const fetchEmails = async (data) => {
  const response = await axios.get(`${API_URL}/emails/`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    params: data,
  });
  return response.data;
};

const fetchEmail = async (id) => {
  const response = await axios.get(`${API_URL}/emails/${id}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.data;
};

const fetchIntegration = async () => {
  const response = await axios.get(`${API_URL}/emails/integrations`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.data;
};

const fetchMailBoxes = async (data) => {
  const response = await axios.get(`${API_URL}/emails/mailboxes/`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    params: data,
  });
  return response.data;
};

const signup = async (data) => {
  const response = await axios.post(`${API_URL}/auth/signup`, data);
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const signin = async (data) => {
  const response = await axios.post(`${API_URL}/auth/signin`, data);
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const signout = () => {
  localStorage.removeItem('user');
};

const getToken = () => {
  return JSON.parse(localStorage.getItem('user'))?.token;
};

const getCurrentUser = () => {
  let token = getToken()
  let user = token != null ? JSON.parse(atob(token.split('.')[1])) : null
  if (!user) return null
  if (1000 * user.exp < Date.now()) {
    signout()
    return null
  }
  return user
};

const authService = {
  connect,
  signup,
  signin,
  signout,
  getCurrentUser,
  API_URL,
  fetchEmails,
  fetchEmail,
  fetchIntegration,
  fetchMailBoxes,
  getToken
};

export default authService;
