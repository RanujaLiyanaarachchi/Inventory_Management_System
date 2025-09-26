import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { UserPlus, Plus, Trash2, Users, Settings, RefreshCw, Image, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from "sonner";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "../ui/dialog";
import { doc, setDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path to your firebase config

interface FormData {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
  profileImage: string | null;
}

interface NewRoleForm {
  name: string;
  permissions: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  profileImage: string | null;
  status: string;
}

interface Role {
  name: string;
  displayName: string;
  permissions: string[];
  isCustom: boolean;
}

export function AddUsers() {
  const { allPermissions, getAllRoles, addCustomRole, deleteCustomRole } = useAuth();
  const [useAutoId, setUseAutoId] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    id: generateUserId(),
    name: '',
    email: '',
    password: '',
    role: '',
    permissions: [],
    profileImage: null
  });

  const [newRoleForm, setNewRoleForm] = useState<NewRoleForm>({
    name: '',
    permissions: []
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [roles, setRoles] = useState<Role[]>([]);

  // Function to generate a unique user ID
  function generateUserId() {
    const prefix = "USR";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
  }

  // Fetch roles from Firebase in real-time
  const fetchRoles = async () => {
    try {
      const rolesCollection = collection(db, 'roles');
      const rolesSnapshot = await getDocs(rolesCollection);
      const rolesList: Role[] = [];

      rolesSnapshot.forEach((doc) => {
        rolesList.push({ ...doc.data() } as Role);
      });

      setRoles(rolesList);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // Real-time listener for roles
  useEffect(() => {
    const rolesCollection = collection(db, 'roles');
    const unsubscribe = onSnapshot(rolesCollection, (snapshot) => {
      const rolesList: Role[] = [];
      snapshot.forEach((doc) => {
        rolesList.push({ ...doc.data() } as Role);
      });
      setRoles(rolesList);
    });

    return () => unsubscribe();
  }, []);

  // Fetch users from Firebase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList: User[] = [];

      usersSnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as User);
      });

      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount
  React.useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Combine default roles with Firebase roles for dropdown
  const getAllAvailableRoles = () => {
    const defaultRoles = [
      { name: 'admin', displayName: 'Admin', permissions: allPermissions, isCustom: false },
      { name: 'manager', displayName: 'Manager', permissions: ['dashboard', 'inventory', 'sales', 'reports'], isCustom: false },
      { name: 'cashier', displayName: 'Cashier', permissions: ['dashboard', 'sales'], isCustom: false }
    ];

    // Merge default roles with Firebase roles, avoiding duplicates
    const allRoles = [...defaultRoles];
    roles.forEach(firebaseRole => {
      if (!allRoles.some(role => role.name === firebaseRole.name)) {
        allRoles.push(firebaseRole);
      }
    });

    return allRoles;
  };

  const allAvailableRoles = getAllAvailableRoles();

  // Toggle between auto-generated ID and manual ID
  const handleToggleAutoId = () => {
    const newValue = !useAutoId;
    setUseAutoId(newValue);

    // If toggling to auto ID, generate a new ID
    if (newValue) {
      setFormData(prev => ({ ...prev, id: generateUserId() }));
    }
  };

  // Get permissions for selected role
  const getRolePermissions = (role: string): string[] => {
    const roleData = allAvailableRoles.find(r => r.name === role);
    return roleData ? roleData.permissions : [];
  };

  // Handle role change
  const handleRoleChange = (role: string) => {
    const permissions = getRolePermissions(role);
    setFormData(prev => ({
      ...prev,
      role,
      permissions: [...permissions]
    }));
  };

  // Handle individual permission toggle
  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          profileImage: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to handle clicking on profile image
  const handleProfileImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle profile image upload issues - fix the upload functionality
  const handleProfileImageUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Create a new file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size should be less than 5MB');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          setFormData(prev => ({
            ...prev,
            profileImage: event.target?.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Local implementation of default roles
  const getDefaultRoles = () => {
    return [
      { name: 'admin', displayName: 'Admin', permissions: allPermissions, isCustom: false },
      { name: 'manager', displayName: 'Manager', permissions: ['dashboard', 'inventory', 'sales', 'reports'], isCustom: false },
      { name: 'cashier', displayName: 'Cashier', permissions: ['dashboard', 'sales'], isCustom: false }
    ];
  };

  // Reset all roles to default - improved reset function
  const handleResetRoles = async () => {
    try {
      // Get default roles from the local function
      const defaultRoles = getDefaultRoles();

      // Delete ALL roles first (custom and default) from Firebase
      const rolesCollection = collection(db, 'roles');
      const rolesSnapshot = await getDocs(rolesCollection);

      const deletePromises = rolesSnapshot.docs.map(async (doc) => {
        await deleteDoc(doc.ref);
      });

      await Promise.all(deletePromises);

      // Then add back all the default roles to Firebase
      const addPromises = defaultRoles.map(async (role) => {
        await addDoc(rolesCollection, {
          name: role.name,
          displayName: role.displayName,
          permissions: role.permissions,
          isCustom: false
        });
      });

      await Promise.all(addPromises);

      toast.success('Roles have been reset to default');
    } catch (error) {
      console.error('Reset roles error:', error);
      toast.error('Failed to reset roles');
    }
  };

  // Add new user to Firebase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Check if user ID already exists in Firebase
      const userDocRef = doc(db, 'users', formData.id);
      const userQuery = query(collection(db, 'users'), where('email', '==', formData.email));
      const emailSnapshot = await getDocs(userQuery);

      if (!emailSnapshot.empty) {
        toast.error('Email already exists. Please use a different email.');
        return;
      }

      // Create user document with ID as the primary key
      await setDoc(userDocRef, {
        name: formData.name,
        email: formData.email,
        password: formData.password, // Note: In production, hash this password
        role: formData.role,
        permissions: formData.permissions,
        profileImage: formData.profileImage,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Refresh users list
      await fetchUsers();

      // Reset form with new auto ID
      setFormData({
        id: generateUserId(),
        name: '',
        email: '',
        password: '',
        role: '',
        permissions: [],
        profileImage: null
      });

      toast.success('User added successfully to Firebase');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user to Firebase');
    } finally {
      setLoading(false);
    }
  };

  // Handle custom role permission toggle
  const handleCustomRolePermissionToggle = (permission: string) => {
    setNewRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Add custom role to Firebase
  const handleAddCustomRole = async () => {
    if (!newRoleForm.name.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    if (newRoleForm.permissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    try {
      setLoading(true);

      // Check if role already exists
      const rolesCollection = collection(db, 'roles');
      const roleQuery = query(rolesCollection, where('name', '==', newRoleForm.name.toLowerCase()));
      const roleSnapshot = await getDocs(roleQuery);

      if (!roleSnapshot.empty) {
        toast.error('Role name already exists');
        return;
      }

      // Add custom role to Firebase
      await addDoc(rolesCollection, {
        name: newRoleForm.name.toLowerCase(),
        displayName: newRoleForm.name,
        permissions: newRoleForm.permissions,
        isCustom: true,
        createdAt: new Date().toISOString()
      });

      setNewRoleForm({ name: '', permissions: [] });
      toast.success('Custom role created successfully in Firebase');
    } catch (error) {
      console.error('Error adding custom role:', error);
      toast.error('Failed to create custom role');
    } finally {
      setLoading(false);
    }
  };

  // Delete role from Firebase
  const handleDeleteRole = async (roleName: string, isCustom: boolean) => {
    try {
      setLoading(true);

      // Find the role document
      const rolesCollection = collection(db, 'roles');
      const roleQuery = query(rolesCollection, where('name', '==', roleName));
      const roleSnapshot = await getDocs(roleQuery);

      if (roleSnapshot.empty) {
        toast.error('Role not found');
        return;
      }

      // Check if any users are using this role
      const usersCollection = collection(db, 'users');
      const usersQuery = query(usersCollection, where('role', '==', roleName));
      const usersSnapshot = await getDocs(usersQuery);

      if (!usersSnapshot.empty) {
        toast.error(`Cannot delete role. ${usersSnapshot.size} user(s) are currently using this role.`);
        return;
      }

      // Delete the role
      const roleDoc = roleSnapshot.docs[0];
      await deleteDoc(roleDoc.ref);

      toast.success(`${isCustom ? 'Custom' : 'Default'} role deleted successfully`);
    } catch (error) {
      console.error(`Error deleting role ${roleName}:`, error);
      toast.error(`Failed to delete role: ${roleName}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column with Add User Form and Custom Role */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add User Form */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserPlus className="h-5 w-5" />
                Add New User
              </CardTitle>
              <CardDescription>Create a new user account with specific permissions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image and User ID Section */}
                <div className="flex flex-col items-center space-y-6">
                  {/* Profile image */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      onClick={handleProfileImageUploadClick}
                      className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer relative group"
                    >
                      {formData.profileImage ? (
                        <img
                          src={formData.profileImage}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Camera className="h-8 w-8 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload photo</span>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleProfileImageUploadClick}
                      className="h-7 px-3 text-xs flex items-center gap-1"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Change Photo
                    </Button>
                    <Input
                      ref={fileInputRef}
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {/* User ID */}
                  <div className="flex flex-col space-y-3 w-full max-w-md">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="userId" className="text-base">User ID *</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant={useAutoId ? "default" : "outline"}
                        className="h-7 px-3 text-xs"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleToggleAutoId()}
                      >
                        {useAutoId ? "Auto ID: ON" : "Auto ID: OFF"}
                      </Button>
                    </div>
                    <Input
                      id="userId"
                      value={formData.id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                      placeholder="Enter user ID"
                      disabled={useAutoId}
                      required
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-base">Role *</Label>
                    <Select value={formData.role} onValueChange={handleRoleChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {allAvailableRoles.map(role => (
                          <SelectItem key={role.name} value={role.name}>
                            {role.displayName}
                            {role.isCustom && <Badge variant="outline" className="ml-2">Custom</Badge>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Permissions Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Permissions</Label>
                    <Badge variant="outline">
                      {formData.permissions.length} of {allPermissions.length} selected
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg max-h-64 overflow-y-auto bg-muted/10">
                    {allPermissions.map(permission => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={formData.permissions.includes(permission)}
                          onCheckedChange={() => handlePermissionToggle(permission)}
                        />
                        <Label
                          htmlFor={permission}
                          className="text-sm font-normal capitalize cursor-pointer"
                        >
                          {permission.replace('-', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Quick Selection Buttons */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, permissions: [...allPermissions] }))}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, permissions: [] }))}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {loading ? 'Adding User...' : 'Add User'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Create Custom Role */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Settings className="h-5 w-5" />
                  Manage Roles
                </CardTitle>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Reset to Default
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Roles to Default</DialogTitle>
                      <DialogDescription>
                        This will remove all roles and restore the default system roles.
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          onClick={handleResetRoles}
                          variant="destructive"
                          disabled={loading}
                        >
                          {loading ? 'Resetting...' : 'Yes, Reset Roles'}
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>Create new roles or reset to default system roles</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Create Custom Role Section - Fixed alignment */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Create Custom Role</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-2 md:col-span-4">
                      <Label>Role Name *</Label>
                      <Input
                        placeholder="Enter role name (e.g., Sales Manager)"
                        value={newRoleForm.name}
                        onChange={(e) => setNewRoleForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <Button
                      onClick={handleAddCustomRole}
                      className="w-full"
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {loading ? 'Creating...' : 'Create Role'}
                    </Button>
                  </div>

                  {/* Custom Role Permissions */}
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <Label>Permissions for New Role *</Label>
                      <Badge variant="outline">
                        {newRoleForm.permissions.length} of {allPermissions.length} selected
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto bg-muted/10">
                      {allPermissions.map(permission => (
                        <div key={`new-role-${permission}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`new-role-${permission}`}
                            checked={newRoleForm.permissions.includes(permission)}
                            onCheckedChange={() => handleCustomRolePermissionToggle(permission)}
                          />
                          <Label
                            htmlFor={`new-role-${permission}`}
                            className="text-sm font-normal capitalize cursor-pointer"
                          >
                            {permission.replace('-', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>

                    {/* Quick Selection Buttons for New Role */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewRoleForm(prev => ({ ...prev, permissions: [...allPermissions] }))}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewRoleForm(prev => ({ ...prev, permissions: [] }))}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* All Roles Section */}
                <div className="space-y-3">
                  <h3 className="text-base font-medium">All Available Roles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
                    {allAvailableRoles.map(role => (
                      <div key={role.name} className="p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium">
                            {role.displayName}
                          </h5>
                          <div className="flex items-center gap-2">
                            <Badge variant={role.isCustom ? "outline" : "secondary"}>
                              {role.isCustom ? "Custom" : "System"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRole(role.name, role.isCustom)}
                              className="h-7 w-7 p-0"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {role.permissions.length} permissions
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 2).map(permission => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission.replace('-', ' ')}
                            </Badge>
                          ))}
                          {role.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar with Users and Roles */}
        <div className="space-y-6">
          {/* Recent Users */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xl">Recent Users</CardTitle>
              <CardDescription>Recently added users</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex justify-center py-6">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mb-2" />
                  <p>No users added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.slice(-5).map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">{user.name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">{user.name}</p>
                          <Badge variant="secondary" className="text-xs font-mono">
                            {user.id}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {user.role.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Management Tips */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xl">Role Management Tips</CardTitle>
              <CardDescription>Best practices for managing user roles</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Default Roles</h3>
                  <p className="text-sm text-muted-foreground">
                    System comes with predefined roles like Admin, Manager, Cashier, and User.
                    All roles can be deleted if no longer needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Custom Roles</h3>
                  <p className="text-sm text-muted-foreground">
                    Create custom roles when your organization has specific permission requirements
                    not covered by default roles.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Permissions</h3>
                  <p className="text-sm text-muted-foreground">
                    Each permission corresponds to access to a specific feature in the system.
                    Carefully assign permissions based on user responsibilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}