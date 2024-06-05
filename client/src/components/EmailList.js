import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import './emailList.css';

const EmailList = ({ emails, setEmails, emailAccount }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mailBoxes, setMailBoxes] = useState([]);

  useEffect(() => {
    const loadEmails = async () => {
      try {
        const mailBoxes = await apiService.fetchMailBoxes({
          emailAccount: emailAccount
        });
        setMailBoxes(mailBoxes);

        const data = await apiService.fetchEmails({
          emailAccount: emailAccount
        });
        setEmails(data);
      } catch (error) {
        console.log(error)
        setError('Failed to fetch emails');
      } finally {
        setLoading(false);
      }
    };

    loadEmails();
  }, []);

  if (loading) {
    return <p>Loading emails...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="email-container">
      <ul className="email-list">
        {emails.map((email) => {
          const mailBox = mailBoxes.find((mailBox) => email.mailBoxId === mailBox._id || email.mailBoxId === mailBox.externalId);
          return (
            <li key={email.externalId} className={`email-item ${!email.isRead ? 'unread-email' : ''}`}>
              <span>{email.subject}</span>
              <span>From: {email.senderEmail}</span>
              <span className="date">Date: {new Date(email.date).toLocaleString()}</span>
              <span className="mailbox">Mailbox: {mailBox?.displayName}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EmailList;