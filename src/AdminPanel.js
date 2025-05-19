// AdminPanel.js
import React, { useState, useEffect } from 'react';
import supabase from './supabaseClient'; // Make sure to import supabase client

const AdminPanel = () => {
  console.log("👀 AdminPanel rendered"); // ✅ Add this line
  const [submissions, setSubmissions] = useState([]);

  
  useEffect(() => {
    // Fetch unapproved submissions
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
  }, []);

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
