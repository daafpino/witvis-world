// AdminPanel.js
import React, { useState, useEffect } from 'react';
import supabase from './supabaseClient';

const AdminPanel = () => {
  console.log("👀 AdminPanel rendered");

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [submissions, setSubmissions] = useState([]);

  const PASSWORD = "maui"; // 🔒 Change this to your real password

  useEffect(() => {
    if (passwordInput === PASSWORD) {
      setIsAuthorized(true);
    }
  }, [passwordInput]);

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('approved', false); // Only get unapproved images

      if (error) {
        console.error("Error fetching submissions:", error);
      } else {
        setSubmissions(data);
      }
    };

    fetchSubmissions();
  }, [isAuthorized]);

  const handleApprove = async (id) => {
    const { error } = await supabase
      .from('submissions')
      .update({ approved: true }) // Approve image
      .eq('id', id);

    if (error) {
      console.error("Error approving submission:", error);
    } else {
      // Refresh the list of submissions after approving
      setSubmissions(submissions.filter(submission => submission.id !== id));
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h2>Admin Access</h2>
        <p>Please enter the password:</p>
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Password"
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <ul>
        {submissions.map(submission => (
          <li key={submission.id}>
            <img src={submission.imageUrl} alt={submission.fileName} width="100" />
            <div>{submission.username}</div>
            <div>{submission.tags}</div>
            <div>{submission.location}</div>
            <button onClick={() => handleApprove(submission.id)}>Approve</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPanel;
