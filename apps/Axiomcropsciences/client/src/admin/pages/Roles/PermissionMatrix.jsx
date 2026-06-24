// PermissionMatrix — defines what each role can do per module
// This is the source of truth for the visual matrix in RolesPage

export const ROLES = [
  {
    key:         'super_admin',
    label:       'Super Admin',
    color:       '#ef4444',
    bg:          'rgba(239,68,68,0.12)',
    description: 'Full unrestricted access to everything. Cannot be modified.',
    isSystem:    true,
  },
  {
    key:         'admin',
    label:       'Admin',
    color:       '#1F7A3D',
    bg:          'rgba(31,122,61,0.12)',
    description: 'Full access except user role management.',
    isSystem:    false,
  },
  {
    key:         'editor',
    label:       'Editor',
    color:       '#3B82F6',
    bg:          'rgba(59,130,246,0.12)',
    description: 'Can manage content: products, blogs, banners, pages, categories.',
    isSystem:    false,
  },
  {
    key:         'support',
    label:       'Support',
    color:       '#F59E0B',
    bg:          'rgba(245,158,11,0.12)',
    description: 'Can view and manage orders and enquiries only.',
    isSystem:    false,
  },
  {
    key:         'viewer',
    label:       'Viewer',
    color:       '#6B7280',
    bg:          'rgba(107,114,128,0.12)',
    description: 'Read-only access. Cannot create, edit, or delete anything.',
    isSystem:    false,
  },
];

// Modules and what each role can do
// Permissions: 'full' | 'view' | 'none'
export const MODULES = [
  {
    label: 'Dashboard',
    key:   'dashboard',
    permissions: { super_admin: 'full', admin: 'full', editor: 'view', support: 'view', viewer: 'view' },
  },
  {
    label: 'Products',
    key:   'products',
    permissions: { super_admin: 'full', admin: 'full', editor: 'full', support: 'view', viewer: 'view' },
  },
  {
    label: 'Categories',
    key:   'categories',
    permissions: { super_admin: 'full', admin: 'full', editor: 'full', support: 'view', viewer: 'view' },
  },
  {
    label: 'Orders',
    key:   'orders',
    permissions: { super_admin: 'full', admin: 'full', editor: 'view', support: 'full', viewer: 'view' },
  },
  {
    label: 'Enquiries',
    key:   'enquiries',
    permissions: { super_admin: 'full', admin: 'full', editor: 'view', support: 'full', viewer: 'view' },
  },
  {
    label: 'Customers',
    key:   'customers',
    permissions: { super_admin: 'full', admin: 'full', editor: 'none', support: 'full', viewer: 'view' },
  },
  {
    label: 'Banners',
    key:   'banners',
    permissions: { super_admin: 'full', admin: 'full', editor: 'full', support: 'none', viewer: 'view' },
  },
  {
    label: 'Blog',
    key:   'blog',
    permissions: { super_admin: 'full', admin: 'full', editor: 'full', support: 'none', viewer: 'view' },
  },
  {
    label: 'Pages / CMS',
    key:   'pages',
    permissions: { super_admin: 'full', admin: 'full', editor: 'full', support: 'none', viewer: 'view' },
  },
  {
    label: 'Media Library',
    key:   'media',
    permissions: { super_admin: 'full', admin: 'full', editor: 'full', support: 'none', viewer: 'view' },
  },
  {
    label: 'Coupons',
    key:   'coupons',
    permissions: { super_admin: 'full', admin: 'full', editor: 'none', support: 'none', viewer: 'view' },
  },
  {
    label: 'Analytics',
    key:   'analytics',
    permissions: { super_admin: 'full', admin: 'full', editor: 'view', support: 'view', viewer: 'view' },
  },
  {
    label: 'Website Builder',
    key:   'website_builder',
    permissions: { super_admin: 'full', admin: 'full', editor: 'full', support: 'none', viewer: 'view' },
  },
  {
    label: 'Theme Builder',
    key:   'theme_builder',
    permissions: { super_admin: 'full', admin: 'full', editor: 'none', support: 'none', viewer: 'view' },
  },
  {
    label: 'SEO',
    key:   'seo',
    permissions: { super_admin: 'full', admin: 'full', editor: 'full', support: 'none', viewer: 'view' },
  },
  {
    label: 'Settings',
    key:   'settings',
    permissions: { super_admin: 'full', admin: 'full', editor: 'none', support: 'none', viewer: 'view' },
  },
  {
    label: 'Users (Admin Team)',
    key:   'users',
    permissions: { super_admin: 'full', admin: 'view', editor: 'none', support: 'none', viewer: 'none' },
  },
  {
    label: 'Roles & Permissions',
    key:   'roles',
    permissions: { super_admin: 'full', admin: 'view', editor: 'none', support: 'none', viewer: 'none' },
  },
  {
    label: 'Activity Logs',
    key:   'logs',
    permissions: { super_admin: 'full', admin: 'full', editor: 'none', support: 'none', viewer: 'view' },
  },
];
