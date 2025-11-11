import React from "react";
import Dashboard from "../../components/Dashboard/Dashboard";

const SubDashboard = ({ userData, onLogout }) => {
  return (
    <Dashboard userData={userData} onLogout={onLogout}>
      <div className="panel">
        <h2>Sub Admin Dashboard</h2>
        <p>Access: Manage assigned users or specific departments.</p>
      </div>
    </Dashboard>
  );
};

export default SubDashboard;