import React, { useState } from 'react';

// Sample dummy data
const dummyEmails = [
  {
    id: 1,
    sender: 'alice@example.com',
    subject: 'Meeting Reminder',
    body: 'Don’t forget about our meeting tomorrow at 10 AM.',
    time: '9:24 AM',
  },
  {
    id: 2,
    sender: 'bob@example.com',
    subject: 'Lunch?',
    body: 'Hey, are you free for lunch today?',
    time: '8:15 AM',
  },
  {
    id: 3,
    sender: 'news@newsletter.com',
    subject: 'Weekly Digest',
    body: 'Here’s what you missed this week...',
    time: 'Yesterday',
  },
];

const Inbox = () => {
  const [emails, setEmails] = useState(dummyEmails);
  const [selectedEmail, setSelectedEmail] = useState(null);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>Inbox</h2>
        {emails.map((email) => (
          <div
            key={email.id}
            style={styles.emailPreview}
            onClick={() => setSelectedEmail(email)}
          >
            <strong>{email.sender}</strong>
            <p>{email.subject}</p>
            <small>{email.time}</small>
          </div>
        ))}
      </div>
      <div style={styles.content}>
        {selectedEmail ? (
          <div>
            <h3>{selectedEmail.subject}</h3>
            <p><strong>From:</strong> {selectedEmail.sender}</p>
            <p>{selectedEmail.body}</p>
          </div>
        ) : (
          <p>Select an email to read</p>
        )}
      </div>
    </div>
  );
};

// Inline styles for simplicity
const styles = {
  container: {
    display: 'flex',
    border: '1px solid #ccc',
    height: '400px',
    fontFamily: 'Arial, sans-serif',
  },
  sidebar: {
    width: '250px',
    borderRight: '1px solid #ccc',
    padding: '10px',
    overflowY: 'auto',
  },
  emailPreview: {
    borderBottom: '1px solid #eee',
    padding: '10px 0',
    cursor: 'pointer',
  },
  content: {
    flex: 1,
    padding: '20px',
  },
};

export default Inbox;
