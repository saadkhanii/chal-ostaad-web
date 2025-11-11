import React from "react";
import Dashboard from "../../components/Dashboard/Dashboard";

const SuperDashboard = ({ userData, onLogout }) => {
  return (
    <Dashboard userData={userData} onLogout={onLogout}>
      <div className="panel">
        <h2>Super Admin Dashboard</h2>
        <p>Access: Manage all users, view system stats, configure settings, etc.</p>
      </div>
    </Dashboard>
  );
};

export default SuperDashboard;