/**
 * User Roles and Models for Coproperty Management
 */

export enum CopropertyRole {
  SYNDIC = 'coproperty-syndic',
  OWNER = 'coproperty-owner',
  COUNCIL = 'coproperty-council',
  ACCOUNTANT = 'coproperty-accountant',
  ADMIN = 'system-admin'
}

export interface UserWithRole {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: CopropertyRole[];
  permissions: string[];
  managedCoproperties?: string[];  // For syndic
  ownedUnits?: string[];           // For owner
}

export interface CopropertyPermissions {
  // Coproperty management
  'coproperty:create': boolean;
  'coproperty:read': boolean;
  'coproperty:update': boolean;
  'coproperty:delete': boolean;
  
  // Charges management
  'charges:create': boolean;
  'charges:read': boolean;
  'charges:update': boolean;
  'charges:delete': boolean;
  'charges:manage': boolean;
  
  // Invoices management
  'invoices:create': boolean;
  'invoices:read': boolean;
  'invoices:update': boolean;
  'invoices:delete': boolean;
  'invoices:manage': boolean;
  
  // Maintenance requests
  'maintenance:create': boolean;
  'maintenance:read': boolean;
  'maintenance:update': boolean;
  'maintenance:delete': boolean;
  'maintenance:assign': boolean;
  
  // Fund calls
  'fundcalls:create': boolean;
  'fundcalls:read': boolean;
  'fundcalls:update': boolean;
  'fundcalls:send': boolean;
  
  // Financial reports
  'reports:view': boolean;
  'reports:export': boolean;
  
  // System administration
  'system:users': boolean;
  'system:permissions': boolean;
  'system:monitoring': boolean;
}

export type Permission = keyof CopropertyPermissions;
