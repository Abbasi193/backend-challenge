import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import '../index.css';

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
    <div>
      <h2>Emails</h2>
      <ul>
        {emails.map((email) => (
          <>
            <li key={email.externalId} className={!email.isRead ? 'unread-email' : ''}>
              <span>{email.subject}</span><br />
              <span>From:{email.senderEmail}</span><br />
              <span>Date:{new Date(email.date).toLocaleString()}</span><br />
              <span>Mailbox: {mailBoxes.filter((mailBox) => {
                return email.mailBoxId == mailBox._id || email.mailBoxId == mailBox.externalId
              })[0]?.displayName}</span><br />
            </li>
            <br />
          </>
        ))}
      </ul>
    </div>
  );
};

export default EmailList;