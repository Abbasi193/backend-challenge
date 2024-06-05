import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmailList from './EmailList'
import apiService from '../services/apiService';
import io from 'socket.io-client';
import LoadingScreen from './LoadingScreen';
import './home.css';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [emails, setEmails] = useState([]);
  const [count, setCount] = useState(0);
  const [connectType, setConnectType] = useState('REST_API');
  let socket = null;
  const [loading, setLoading] = useState(true);
  const [integration, setIntegration] = useState();
  const [key, setKey] = useState(0);

  useEffect(() => {
    const loadIntegration = async () => {
      try {
        const data = await apiService.fetchIntegration();
        setIntegration(data);
      } catch (error) {
        setIntegration(null)
      } finally {
        setLoading(false);
      }
    };

    loadIntegration();
  }, []);

  useEffect(() => {
    const user = apiService.getCurrentUser();
    if (!user) {
      navigate('/signin');
      return;
    }

    if (location.state?.isConnected) {
      setIsSyncing(true);
    }

    socket = io(`${apiService.API_URL}`, {
      extraHeaders: {
        Authorization: `Bearer ${apiService.getToken()}`
      }
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    socket.on('fetched', (data) => {
      setCount((count) => {
        return (count + data.value)
      })
      handleRefresh()
      console.log('fetched', data);
    });

    socket.on('created', async (data) => {
      console.log('created', data);
      let newObj = await apiService.fetchEmail(data.value);
      setEmails((emails) => {
        let temp = emails.filter((obj) => {
          return obj.externalId !== newObj.externalId
        })
        return [newObj, ...temp]
      })
    });

    socket.on('updated', async (data) => {
      console.log('updated', data);
      let newObj = await apiService.fetchEmail(data.value);
      setEmails((emails) => {
        return emails.map(obj => {
          if (obj.externalId === newObj.externalId) {
            return newObj;
          } else {
            return obj;
          }
        })
      })
    });

    socket.on('deleted', async (data) => {
      console.log('deleted', data);
      setEmails((emails) => {
        return emails.filter((obj) => {
          return obj.externalId !== data.value
        })
      })
    });

    socket.on('completed', (data) => {
      console.log('completed', data);
      setIsSyncing(false);
      handleRefresh()
    });

    socket.on('failed', (data) => {
      console.log('failed', data);
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [navigate]);

  const handleSignOut = () => {
    apiService.signout();
    navigate('/signin');
  };

  const handleRefresh = () => {
    setKey(prevKey => prevKey + 1);
  };

  const handleConnect = () => {
    window.location.href = `${apiService.API_URL}/auth/url?type=${connectType}`;
  };

  const user = apiService.getCurrentUser();

  if (loading) {
    return <LoadingScreen text="Loading..." />;
  }

  return (
    <div className="welcome-container">
      <h2>Welcome {user?.email}</h2>
      <button onClick={handleSignOut}>Sign Out</button>
      {isSyncing && (
        <div className="sync-info">
          <p>Syncing...</p>
          <p>{count} Emails synced</p>
        </div>
      )}
      {integration == null ? (
        <div>
          <label htmlFor="connectType">Protocol</label>
          <select
            id="connectType"
            value={connectType}
            onChange={(e) => setConnectType(e.target.value)}
          >
            <option value="IMAP">IMAP</option>
            <option value="REST_API">REST_API</option>
          </select><br/>
          <button onClick={handleConnect}>Connect with Outlook</button>
        </div>
      ) : (
        <div>
          <button onClick={handleRefresh}>Refresh</button>
          <EmailList key={key} emails={emails} setEmails={setEmails} emailAccount={integration.email} />
        </div>
      )}
    </div>
  );
};

export default Home;
