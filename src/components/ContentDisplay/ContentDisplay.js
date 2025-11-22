import React from "react";
import "./ContentDisplay.css";
import { menuConfig } from "../../config/menuConfig";
import AddAdmin from "../Admins/AddAdmin";
import ManageCategories from "../Workers/ManageCategories";
import ViewCategories from "../Workers/ViewCategories";
import AddWorker from "../Workers/AddWorker";
import ManageWorkers from "../Workers/ManageWorkers";
import ViewWorkers from "../Workers/ViewWorkers";
import AddOffice from '../Offices/AddOffice';
import ViewOffices from '../Offices/ViewOffices';
import ManageOffices from '../Offices/ManageOffices';
import ViewAdmins from '../Admins/ViewAdmins';
import WorkerVerification from '../Workers/WorkerVerification';
import DashboardFull from '../Dashboard/DashboardFull';
import ManageAdmins from '../Admins/ManageAdmins';

// Placeholder components for other menu items
const AllAdmins = () => <div>All Admins Component - Coming Soon!</div>;
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
        ManageAdmins,
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
        // If no active item or dashboard is selected, show DashboardFull
        if (!activeItem || activeItem === 'dashboard') {
            return <DashboardFull />;
        }

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
                        'manage-admins': ManageAdmins,
                        'admin-activity': AdminActivity,

                        // Workers submenu
                        'view-workers': ViewWorkers,
                        'add-worker': AddWorker,
                        'manage-workers': ManageWorkers,
                        'manage-categories': ManageCategories, 
                        'view-categories': ViewCategories,
                        'worker-verification': WorkerVerification,
                        'worker-performance': WorkerPerformance,

                        // Offices submenu
                        'view-offices': ViewOffices,
                        'add-office': AddOffice,
                        'manage-offices': ManageOffices,
                        'office-zones': OfficeZones,
                        'office-schedule': OfficeSchedule,
                    };

                    const SubComponent = subComponentMap[subItem.id] || (() => <div>{subItem.name} - Coming Soon!</div>);
                    return <SubComponent />;
                }
            }
        }

        return <DashboardFull />; // Fallback to dashboard
    };

    const getActiveTitle = () => {
        // Professional slogan mapping
        const professionalSlogans = {
            // Dashboard
            'dashboard': "Strategic oversight and performance analytics for informed decision-making",
            
            // Admins
            'admins': "Administrative team management and access control configuration",
            'view-admins': "Comprehensive overview of all administrative personnel",
            'add-admin': "Onboard new administrative team members with precision",
            'manage-admins': "Refine permissions and optimize administrative workflows",
            'admin-activity': "Monitor system interactions and administrative operations",
            
            // Workers
            'workers': "Service provider management and workforce optimization",
            'view-workers': "Complete directory of registered service professionals",
            'add-worker': "Expand your service network with qualified professionals",
            'manage-workers': "Streamline workforce management and service delivery",
            'worker-verification': "Quality assurance through rigorous verification processes",
            'worker-performance': "Performance metrics and service excellence tracking",
            
            // Categories
            'manage-categories': "Service category architecture and specialization management",
            'view-categories': "Service portfolio overview and market segmentation",
            
            // Offices
            'offices': "Operational hub management and geographical coverage",
            'view-offices': "Network overview of all operational service centers",
            'add-office': "Establish new service locations and expand market presence",
            'manage-offices': "Operational excellence through location management",
            'office-zones': "Service territory mapping and coverage optimization",
            'office-schedule': "Operational hours and service availability configuration",
            
            // Disputes & Reviews
            'disputes': "Conflict resolution and customer satisfaction management",
            'reviews': "Service quality feedback and reputation management",
            
            // Settings
            'settings': "System configuration and platform customization",
            'settings-personal': "Personal profile management and preference settings"
        };

        // If no active item or dashboard, show dashboard title
        if (!activeItem || activeItem === 'dashboard') {
            return {
                title: "Admin Dashboard",
                subtitle: professionalSlogans['dashboard']
            };
        }

        // Check main menu
        let menuItem = menuConfig.find(item => item.id === activeItem);
        if (menuItem) return {
            title: menuItem.name,
            subtitle: professionalSlogans[activeItem] || `Strategic management of ${menuItem.name.toLowerCase()}`
        };

        // Check submenus
        for (let item of menuConfig) {
            if (item.submenu) {
                const subItem = item.submenu.find(sub => sub.id === activeItem);
                if (subItem) return {
                    title: subItem.name,
                    subtitle: professionalSlogans[activeItem] || `Professional management of ${subItem.name.toLowerCase()}`
                };
            }
        }

        return {
            title: "Admin Dashboard",
            subtitle: professionalSlogans['dashboard']
        };
    };

    const activeComponent = getActiveComponent();
    const { title, subtitle } = getActiveTitle();

    return (
        <div className="content-display">
            <div className="content-panel">
                {/* NEW: Dashboard-style header for all components */}
                <div className="content-header">
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </div>
                <div className="content-area">
                    {activeComponent}
                </div>
            </div>
        </div>
    );
};

export default ContentDisplay;