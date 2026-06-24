// Server-side copy of the default permission matrix.
const MODULES = [
  { label:'Dashboard',        key:'dashboard',      permissions:{ super_admin:'full',admin:'full',editor:'view', support:'view', viewer:'view' }},
  { label:'Products',         key:'products',       permissions:{ super_admin:'full',admin:'full',editor:'full', support:'view', viewer:'view' }},
  { label:'Categories',       key:'categories',     permissions:{ super_admin:'full',admin:'full',editor:'full', support:'view', viewer:'view' }},
  { label:'Orders',           key:'orders',         permissions:{ super_admin:'full',admin:'full',editor:'view', support:'full', viewer:'view' }},
  { label:'Enquiries',        key:'enquiries',      permissions:{ super_admin:'full',admin:'full',editor:'view', support:'full', viewer:'view' }},
  { label:'Customers',        key:'customers',      permissions:{ super_admin:'full',admin:'full',editor:'none', support:'full', viewer:'view' }},
  { label:'Banners',          key:'banners',        permissions:{ super_admin:'full',admin:'full',editor:'full', support:'none', viewer:'view' }},
  { label:'Blog',             key:'blog',           permissions:{ super_admin:'full',admin:'full',editor:'full', support:'none', viewer:'view' }},
  { label:'Pages / CMS',      key:'pages',          permissions:{ super_admin:'full',admin:'full',editor:'full', support:'none', viewer:'view' }},
  { label:'Media Library',    key:'media',          permissions:{ super_admin:'full',admin:'full',editor:'full', support:'none', viewer:'view' }},
  { label:'Coupons',          key:'coupons',        permissions:{ super_admin:'full',admin:'full',editor:'none', support:'none', viewer:'view' }},
  { label:'Analytics',        key:'analytics',      permissions:{ super_admin:'full',admin:'full',editor:'view', support:'view', viewer:'view' }},
  { label:'Website Builder',  key:'website_builder',permissions:{ super_admin:'full',admin:'full',editor:'full', support:'none', viewer:'view' }},
  { label:'Theme Builder',    key:'theme_builder',  permissions:{ super_admin:'full',admin:'full',editor:'none', support:'none', viewer:'view' }},
  { label:'SEO',              key:'seo',            permissions:{ super_admin:'full',admin:'full',editor:'full', support:'none', viewer:'view' }},
  { label:'Settings',         key:'settings',       permissions:{ super_admin:'full',admin:'full',editor:'none', support:'none', viewer:'view' }},
  { label:'Users (Admin)',     key:'users',          permissions:{ super_admin:'full',admin:'view',editor:'none', support:'none', viewer:'none' }},
  { label:'Roles',             key:'roles',          permissions:{ super_admin:'full',admin:'view',editor:'none', support:'none', viewer:'none' }},
  { label:'Activity Logs',    key:'logs',           permissions:{ super_admin:'full',admin:'full',editor:'none', support:'none', viewer:'view' }},
];
module.exports = { MODULES };
