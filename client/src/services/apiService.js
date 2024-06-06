import axios from 'axios';

const connect = async (data) => {
  const response = await axios.post(`/api/auth/connect`, data, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.data;
};

const fetchEmails = async (data) => {
  const response = await axios.get(`/api/emails/`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    params: data,
  });
  return response.data;
};

const fetchEmail = async (id) => {
  const response = await axios.get(`/api/emails/${id}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.data;
};

const fetchIntegration = async () => {
  const response = await axios.get(`/api/emails/integrations`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.data;
};

const fetchMailBoxes = async (data) => {
  const response = await axios.get(`/api/emails/mailboxes/`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    params: data,
  });
  return response.data;
};

const signup = async (data) => {
  const response = await axios.post(`/api/auth/signup`, data);
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const signin = async (data) => {
  const response = await axios.post(`/api/auth/signin`, data);
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
  fetchEmails,
  fetchEmail,
  fetchIntegration,
  fetchMailBoxes,
  getToken
};

export default authService;
