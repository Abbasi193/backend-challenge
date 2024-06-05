import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import apiService from '../services/apiService';
import { useNavigate } from 'react-router-dom';


const Callback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    const query = new URLSearchParams(location.search);
    const code = query.get('code');
    const type = query.get('state');

    const handleConnect = async (data) => {
      try {
        await apiService.connect(data);
        navigate('/', { state: { isConnected: true } });
      } catch (error) {
        console.error('Integration error', error);
        alert('Integration failed');
      }
    };

    if (code) {
      handleConnect({
        code,
        provider: 'Microsoft',
        type: type
      })
    } else {
      console.log('No authorization code found');
    }
  }, [location, navigate]);

  return (
    <div>
      <p>Processing authentication...</p>
    </div>
  );
};

export default Callback;
