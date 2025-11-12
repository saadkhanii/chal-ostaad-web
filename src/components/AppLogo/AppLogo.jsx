import React from "react";
import "./AppLogo.css";

const AppLogo = ({ size = "default" }) => {
  const isSmall = size === "small";
  
  return (
    <div className={`app-logo ${isSmall ? 'small' : ''}`}>
      <span className="logo-box">
        <span className="logo-text">
          CHAL
        </span>
      </span>
      <span className="logo-title">
        OSTAAD
      </span>
    </div>
  );
};

export default AppLogo;