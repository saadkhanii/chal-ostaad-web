import React, { useState } from "react";
import "./Dashboard.css";
import AppLogo from "../AppLogo/AppLogo";
import Navigation from "../Navigation/Navigation";
import ContentDisplay from "../ContentDisplay/ContentDisplay";

const Dashboard = ({ userData, onLogout }) => {
  // Set 'dashboard' as the default active item
  const [activeItem, setActiveItem] = useState('dashboard');

  return (
    <div className="dash-root">
      <div className="dash-grid">
        {/* Logo */}
        <div className="cell cell-0-0">
          <section className="panel logo-panel">
            <AppLogo size="small"/>
          </section>
        </div>

        {/* User Info */}
        <div className="cell cell-0-1">
          <section className="panel user-info-panel">
            <div className="user-info-content">
              <div className="user-welcome">
                <span className="welcome-text">Welcome 👋</span>
                <span className="user-name">{userData.name || "User"}</span>
              </div>
              <div className="user-role">
                {userData.role === "super" ? "Super Admin" : "Sub Admin"}
              </div>
            </div>
          </section>
        </div>

        {/* Navigation Menu - Cell 1-0 */}
        <div className="cell cell-1-0">
          <Navigation 
            activeItem={activeItem}
            onItemClick={setActiveItem}
            userRole={userData.role}
            onLogout={onLogout}
          />
        </div>

        {/* Content Display - Cell 1-1 */}
        <div className="cell cell-1-1">
          <ContentDisplay 
            activeItem={activeItem}
            userRole={userData.role}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;