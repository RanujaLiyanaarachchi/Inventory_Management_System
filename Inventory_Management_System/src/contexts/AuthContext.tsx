import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  userType: string;
  profileImage: string | null;
  createdAt: string;
}

export interface Role {
  name: string;
  displayName: string;
  permissions: string[];
  isCustom: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
  allPermissions: string[];
  rolePermissions: Record<string, string[]>;
  userTypes: string[];
  availableRoles: string[];
  customRoles: Role[];
  addCustomRole: (roleName: string, permissions: string[]) => Role;
  updateCustomRole: (roleName: string, permissions: string[]) => void;
  deleteCustomRole: (roleName: string) => void;
  getRolePermissions: (role: string) => string[];
  getAllRoles: () => Role[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// All available permissions in the system
const allPermissions = [
  'dashboard', 'users', 'add-users', 'add-suppliers', 'add-products', 
  'stocks', 'category', 'invoice', 'promotions', 'summary-report', 
  'grn', 'barcode', 'supplier-return', 'z-report', 'suppliers', 
  'products', 'bill'
];

// Role-based permissions
const rolePermissions = {
  admin: allPermissions,
  manager: [
    'dashboard', 'users', 'add-suppliers', 'add-products', 'stocks', 'category', 
    'invoice', 'promotions', 'summary-report', 'grn', 'barcode', 
    'supplier-return', 'suppliers', 'products', 'bill'
  ],
  staff: [
    'dashboard', 'stocks', 'invoice', 'barcode', 'products', 'bill'
  ],
  accountant: [
    'dashboard', 'invoice', 'summary-report', 'z-report', 'bill'
  ],
  'inventory-manager': [
    'dashboard', 'stocks', 'products', 'suppliers', 'grn', 'supplier-return', 'barcode'
  ]
};

// Available user types
const userTypes = [
  'Employee',
  'Contractor', 
  'Manager',
  'Supervisor',
  'Admin'
];

// Available roles
const availableRoles = [
  'admin',
  'manager', 
  'staff',
  'accountant',
  'inventory-manager'
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customRoles, setCustomRoles] = useState<Role[]>([]);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('inventory_user');
    const savedCustomRoles = localStorage.getItem('inventory_custom_roles');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedCustomRoles) {
      setCustomRoles(JSON.parse(savedCustomRoles));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Mock authentication - in real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email && password) {
      const permissions = getRolePermissions(role);
      
      const newUser: User = {
        id: '1',
        name: email.split('@')[0],
        email,
        role: role,
        permissions: permissions,
        userType: 'Employee',
        profileImage: null,
        createdAt: new Date().toISOString()
      };
      
      setUser(newUser);
      localStorage.setItem('inventory_user', JSON.stringify(newUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('inventory_user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('inventory_user', JSON.stringify(updatedUser));
  };

  const addCustomRole = (roleName: string, permissions: string[]): Role => {
    const newRole: Role = {
      name: roleName.toLowerCase().replace(/\s+/g, '-'),
      displayName: roleName,
      permissions: permissions,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const updatedCustomRoles = [...customRoles, newRole];
    setCustomRoles(updatedCustomRoles);
    localStorage.setItem('inventory_custom_roles', JSON.stringify(updatedCustomRoles));
    return newRole;
  };

  const updateCustomRole = (roleName: string, permissions: string[]) => {
    const updatedCustomRoles = customRoles.map(role => 
      role.name === roleName 
        ? { ...role, permissions }
        : role
    );
    setCustomRoles(updatedCustomRoles);
    localStorage.setItem('inventory_custom_roles', JSON.stringify(updatedCustomRoles));
  };

  const deleteCustomRole = (roleName: string) => {
    const updatedCustomRoles = customRoles.filter(role => role.name !== roleName);
    setCustomRoles(updatedCustomRoles);
    localStorage.setItem('inventory_custom_roles', JSON.stringify(updatedCustomRoles));
  };

  const getRolePermissions = (role: string): string[] => {
    // Check if it's a custom role
    const customRole = customRoles.find(r => r.name === role);
    if (customRole) {
      return customRole.permissions;
    }
    // Otherwise return standard role permissions
    return rolePermissions[role as keyof typeof rolePermissions] || [];
  };

  const getAllRoles = (): Role[] => {
    return [
      ...availableRoles.map(role => ({
        name: role,
        displayName: role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' '),
        isCustom: false,
        permissions: rolePermissions[role as keyof typeof rolePermissions] || []
      })),
      ...customRoles
    ];
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    updateUser,
    isLoading,
    allPermissions,
    rolePermissions,
    userTypes,
    availableRoles,
    customRoles,
    addCustomRole,
    updateCustomRole,
    deleteCustomRole,
    getRolePermissions,
    getAllRoles
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}