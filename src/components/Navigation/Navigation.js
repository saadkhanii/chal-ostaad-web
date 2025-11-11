import React, { useState } from "react";
import "./Navigation.css";
import { menuConfig } from "../../config/menuConfig";

const Navigation = ({ activeItem, onItemClick, userRole, onLogout }) => {
  const [expandedMenu, setExpandedMenu] = useState(null);

  const toggleSubmenu = (menuId) => {
    setExpandedMenu(prev => prev === menuId ? null : menuId);
  };

  const hasSubmenu = (item) => {
    return item.submenu && item.submenu.length > 0;
  };

  // Check if user has permission for a submenu item
  const hasPermission = (submenuItem, parentItem) => {
    const userPermission = userRole === "super" ? parentItem.superAdmin.permission : parentItem.subAdmin.permission;
    
    // If user has full access, they can see everything
    if (userPermission === 'full') return true;
    
    // If user has view access, only show viewable items
    if (userPermission === 'view') {
      return submenuItem.permission === 'view';
    }
    
    // Add more permission logic as needed
    return false;
  };

  const getMenuItems = () => {
    return menuConfig.map(item => ({
      id: item.id,
      name: item.name,
      permission: userRole === "super" ? item.superAdmin.permission : item.subAdmin.permission,
      hasSubmenu: hasSubmenu(item),
      submenu: item.submenu ? item.submenu.filter(subItem => hasPermission(subItem, item)) : []
    }));
  };

  const handleItemClick = (itemId, hasSubmenu) => {
    if (hasSubmenu) {
      toggleSubmenu(itemId);
    } else {
      onItemClick(itemId);
      setExpandedMenu(null);
    }
  };

  const handleSubmenuClick = (submenuId, e) => {
    e.stopPropagation();
    onItemClick(submenuId);
  };

  const menuItems = getMenuItems();

  return (
    <div className="navigation-panel">
      <div className="nav-items">
        {menuItems.map((item) => (
          <div key={item.id} className="nav-menu-group">
            <div
              className={`nav-item ${activeItem === item.id ? "active" : ""} ${
                item.hasSubmenu ? "has-submenu" : ""
              }`}
              onClick={() => handleItemClick(item.id, item.hasSubmenu)}
              title={`Permission: ${item.permission}`}
            >
              <span className="nav-item-name">{item.name}</span>
              <div className="nav-item-right">
                {item.hasSubmenu && item.submenu.length > 0 && (
                  <span className={`submenu-arrow ${expandedMenu === item.id ? "expanded" : ""}`}>
                    ▼
                  </span>
                )}
                <span className="nav-item-permission">{item.permission}</span>
              </div>
            </div>

            {/* Only show submenu if there are visible items */}
            {item.hasSubmenu && expandedMenu === item.id && item.submenu.length > 0 && (
              <div className="submenu-items">
                {item.submenu.map((subItem) => (
                  <div
                    key={subItem.id}
                    className={`submenu-item ${activeItem === subItem.id ? "active" : ""}`}
                    onClick={(e) => handleSubmenuClick(subItem.id, e)}
                  >
                    <span className="submenu-item-name">{subItem.name}</span>
                    <span className="submenu-permission">{subItem.permission}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="nav-footer">
        <div 
          className="nav-item logout-item"
          onClick={onLogout}
        >
          <span className="nav-item-name">Logout</span>
          <span className="logout-icon">🚪</span>
        </div>
      </div>
    </div>
  );
};

export default Navigation;