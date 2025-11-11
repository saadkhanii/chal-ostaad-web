import React from "react";
import "./ContentDisplay.css";
import { menuConfig } from "../../config/menuConfig";
import AddAdmin from "../Admins/AddAdmin";
import ManageCategories from "../Workers/ManageCategories"; // Updated import
import ViewCategories from "../Workers/ViewCategories";
import AddWorker from "../Workers/AddWorker";
import ViewWorkers from "../Workers/ViewWorkers";
import AddOffice from '../Offices/AddOffice';
import ViewOffices from '../Offices/ViewOffices';
import ViewAdmins from '../Admins/ViewAdmins';
import WorkerVerification from '../Workers/WorkerVerification';
import DashboardFull from '../Dashboard/DashboardFull';

// Placeholder components for other menu items
const AllAdmins = () => <div>All Admins Component - Coming Soon!</div>;
const AdminRoles = () => <div>Admin Roles Management - Coming Soon!</div>;
const AdminActivity = () => <div>Admin Activity Logs - Coming Soon!</div>;
const DashboardLimited = () => <div>Sub Admin Dashboard - Coming Soon!</div>;
const WorkersFull = () => <div>Workers Management - Coming Soon!</div>;
const WorkerPerformance = () => <div>Worker Performance - Coming Soon!</div>;

// OFFICE COMPONENTS
const OfficeZones = () => <div>Office Service Zones - Coming Soon!</div>;
const OfficeSchedule = () => <div>Office Hours Management - Coming Soon!</div>;
const OfficesFull = () => <ViewOffices />;
const OfficesView = () => <ViewOffices />;

const DisputesFull = () => <div>Disputes Management - Coming Soon!</div>;
const ReviewsFull = () => <div>Reviews Management - Coming Soon!</div>;
const SettingsFull = () => <div>System Settings - Coming Soon!</div>;
const SettingsPersonal = () => <div>Personal Settings - Coming Soon!</div>;

const ContentDisplay = ({ activeItem, userRole }) => {
    // Map component names to actual components
    const componentMap = {
        AddAdmin,
        AllAdmins,
        AdminRoles,
        AdminActivity,
        DashboardFull,
        DashboardLimited,
        WorkersFull,
        OfficesFull,
        OfficesView,
        DisputesFull,
        ReviewsFull,
        SettingsFull,
        SettingsPersonal
    };

    const getActiveComponent = () => {
        if (!activeItem) return null;

        // First, check if it's a direct menu item
        let menuItem = menuConfig.find(item => item.id === activeItem);

        if (menuItem) {
            // It's a main menu item
            const componentInfo = userRole === "super" ? menuItem.superAdmin : menuItem.subAdmin;
            const Component = componentMap[componentInfo.component];
            return Component ? <Component /> : <div>Component "{componentInfo.component}" not found</div>;
        }

        // If not found in main menu, check submenus
        for (let item of menuConfig) {
            if (item.submenu) {
                const subItem = item.submenu.find(sub => sub.id === activeItem);
                if (subItem) {
                    // Handle submenu items
                    const subComponentMap = {
                        // Admins submenu
                        'view-admins': ViewAdmins,
                        'add-admin': AddAdmin,
                        'admin-roles': AdminRoles,
                        'admin-activity': AdminActivity,

                        // Workers submenu
                        'view-workers': ViewWorkers,
                        'add-worker': AddWorker,
                        'manage-categories': ManageCategories, 
                        'view-categories': ViewCategories,
                        'worker-verification': WorkerVerification,
                        'worker-performance': WorkerPerformance,

                        // Offices submenu
                        'view-offices': ViewOffices,
                        'add-office': AddOffice,
                        'office-zones': OfficeZones,
                        'office-schedule': OfficeSchedule,
                    };

                    const SubComponent = subComponentMap[subItem.id] || (() => <div>{subItem.name} - Coming Soon!</div>);
                    return <SubComponent />;
                }
            }
        }

        return null;
    };

    const getActiveTitle = () => {
        if (!activeItem) return "Welcome";

        // Check main menu
        let menuItem = menuConfig.find(item => item.id === activeItem);
        if (menuItem) return menuItem.name;

        // Check submenus
        for (let item of menuConfig) {
            if (item.submenu) {
                const subItem = item.submenu.find(sub => sub.id === activeItem);
                if (subItem) return subItem.name;
            }
        }

        return "Unknown";
    };

    const activeComponent = getActiveComponent();

    return (
        <div className="content-display">
            {activeComponent ? (
                <div className="content-panel">
                    <h2>{getActiveTitle()}</h2>
                    <div className="content-area">
                        {activeComponent}
                    </div>
                </div>
            ) : (
                <div className="content-panel welcome-panel">
                    <h2>Welcome to Admin Panel</h2>
                    <div className="welcome-content">
                        <p>Select an item from the menu to manage your system</p>
                        <div className="welcome-info">
                            <p><strong>Role:</strong> {userRole === "super" ? "Super Admin" : "Sub Admin"}</p>
                            <p><strong>Permissions:</strong> {userRole === "super" ? "Full System Access" : "Limited Access"}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentDisplay;