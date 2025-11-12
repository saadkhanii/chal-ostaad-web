export const menuConfig = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    superAdmin: { component: 'DashboardFull', permission: 'full' },
    subAdmin: { component: 'DashboardLimited', permission: 'full' }
  },
  {
    id: 'admins',
    name: 'Admins',
    superAdmin: { component: 'AdminsFull', permission: 'full' },
    subAdmin: { component: 'AdminsView', permission: 'view' },
    submenu: [
      { id: 'view-admins', name: 'View Admins', permission: 'view' },
      { id: 'add-admin', name: 'Add Admin', permission: 'full' },
      { id: 'manage-admins', name: 'Manage Admins', permission: 'full' },
      { id: 'admin-activity', name: 'Admin Activity', permission: 'view' }
    ]
  },
  {
    id: 'workers',
    name: 'Workers', 
    superAdmin: { component: 'WorkersFull', permission: 'full' },
    subAdmin: { component: 'WorkersFull', permission: 'view' },
    submenu: [
      { id: 'view-workers', name: 'View Workers', permission: 'view' },
      { id: 'add-worker', name: 'Add Worker', permission: 'view' },
      { id: 'manage-workers', name: 'Manage Workers', permission: 'view' },
      { id: 'manage-categories', name: 'Manage Categories', permission: 'full' },
      { id: 'view-categories', name: 'View Categories', permission: 'view' },
      { id: 'worker-verification', name: 'Verification', permission: 'view' },
      { id: 'worker-performance', name: 'Performance', permission: 'view' }
    ]
  },
  {
    id: 'offices',
    name: 'Offices',
    superAdmin: { component: 'OfficesFull', permission: 'full' },
    subAdmin: { component: 'OfficesView', permission: 'view' },
    submenu: [
     { id: 'view-offices', name: 'View Offices', permission: 'view' },
      { id: 'add-office', name: 'Add Office', permission: 'full' },
      { id: 'manage-offices', name: 'Manage Offices', permission: 'full' },
      { id: 'office-zones', name: 'Service Zones', permission: 'view' },
      { id: 'office-schedule', name: 'Office Hours', permission: 'view' }
    ]
  },
  {
    id: 'disputes',
    name: 'Disputes',
    superAdmin: { component: 'DisputesFull', permission: 'full' },
    subAdmin: { component: 'DisputesFull', permission: 'full' },
    submenu: [
      { id: 'all-disputes', name: 'All Disputes', permission: 'full' },
      { id: 'open-disputes', name: 'Open Disputes', permission: 'full' },
      { id: 'resolved-disputes', name: 'Resolved', permission: 'full' },
      { id: 'dispute-categories', name: 'Categories', permission: 'full' },
      { id: 'dispute-reports', name: 'Reports', permission: 'view' }
    ]
  },
  {
    id: 'reviews', 
    name: 'Reviews',
    superAdmin: { component: 'ReviewsFull', permission: 'full' },
    subAdmin: { component: 'ReviewsFull', permission: 'full' },
    submenu: [
      { id: 'all-reviews', name: 'All Reviews', permission: 'full' },
      { id: 'pending-reviews', name: 'Pending', permission: 'full' },
      { id: 'approved-reviews', name: 'Approved', permission: 'full' },
      { id: 'review-settings', name: 'Settings', permission: 'full' },
      { id: 'review-analytics', name: 'Analytics', permission: 'view' }
    ]
  },
  {
    id: 'settings',
    name: 'Settings',
    superAdmin: { component: 'SettingsFull', permission: 'full' },
    subAdmin: { component: 'SettingsPersonal', permission: 'personal' },
    submenu: [
      { id: 'general-settings', name: 'General', permission: 'full' },
      { id: 'security-settings', name: 'Security', permission: 'full' },
      { id: 'notification-settings', name: 'Notifications', permission: 'personal' },
      { id: 'profile-settings', name: 'My Profile', permission: 'personal' },
      { id: 'system-logs', name: 'System Logs', permission: 'full' }
    ]
  }
];