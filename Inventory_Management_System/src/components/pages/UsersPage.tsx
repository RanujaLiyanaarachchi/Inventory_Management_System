import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Users, Search, Edit, Trash2, Key, Settings, UserCheck, UserX, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from "sonner";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  userType: string;
  permissions: string[];
  profileImage: string | null;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

interface Role {
  name: string;
  displayName: string;
  permissions: string[];
  isCustom: boolean;
}

export function UsersPage() {
  const { allPermissions, getAllRoles } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [permissionsDialog, setPermissionsDialog] = useState(false);
  const [roleDetailsDialog, setRoleDetailsDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const allRoles = getAllRoles();

  // Fetch users from Firebase in real-time
  useEffect(() => {
    const usersCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const usersList: User[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(usersList);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user: User) => {
    setSelectedUser({...user});
    setEditDialog(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setResetPasswordDialog(true);
  };

  const handleEditPermissions = (user: User) => {
    setSelectedUser(user);
    setEditPermissions([...user.permissions]);
    setPermissionsDialog(true);
  };

  const handleViewRoleDetails = (role: string) => {
    const roleData = allRoles.find(r => r.name === role);
    setSelectedRole(roleData || null);
    setRoleDetailsDialog(true);
  };

  const saveUserEdit = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userDocRef, {
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        userType: selectedUser.userType,
        updatedAt: new Date().toISOString()
      });
      
      setEditDialog(false);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const savePasswordReset = async () => {
    if (!newPassword || !selectedUser) {
      toast.error('Please enter a new password');
      return;
    }

    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userDocRef, {
        password: newPassword, // Note: Hash this password in production
        updatedAt: new Date().toISOString()
      });
      
      setResetPasswordDialog(false);
      setNewPassword('');
      toast.success('Password reset successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userDocRef, {
        permissions: editPermissions,
        updatedAt: new Date().toISOString()
      });
      
      setPermissionsDialog(false);
      toast.success('Permissions updated successfully');
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const currentStatus = userDoc.data().status;
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        
        await updateDoc(userDocRef, {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
        
        toast.success(`User ${newStatus.toLowerCase()} successfully`);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    setEditPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const getRoleColor = (role: string): "destructive" | "default" | "secondary" | "outline" => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'staff': return 'secondary';
      case 'accountant': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{users.length} Total Users</Badge>
          <Badge variant="default">{users.filter(u => u.status === 'Active').length} Active</Badge>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {allRoles.slice(0, 4).map(role => {
          const userCount = users.filter(u => u.role === role.name).length;
          return (
            <Card key={role.name} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewRoleDetails(role.name)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{role.displayName}</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userCount}</div>
                <p className="text-xs text-muted-foreground">
                  {role.permissions.length} permissions
                </p>
                <Badge variant={role.isCustom ? "outline" : "secondary"} className="text-xs mt-1">
                  {role.isCustom ? "Custom" : "System"}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Users
          </CardTitle>
          <CardDescription>Search and manage all system users with their roles and permissions</CardDescription>
          
          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
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
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={getRoleColor(user.role)}
                          className="text-xs cursor-pointer"
                          onClick={() => handleViewRoleDetails(user.role)}
                        >
                          {user.role.replace('-', ' ')}
                        </Badge>
                        <Badge 
                          variant={user.status === 'Active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground mb-4">
                    <p>Type: {user.userType}</p>
                    <p>Permissions: {user.permissions.length}</p>
                    <p>Last Login: {user.lastLogin}</p>
                    <p>Created: {user.createdAt}</p>
                  </div>

                  <div className="flex gap-1 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEditUser(user)} 
                      title="Edit User"
                      disabled={loading}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleResetPassword(user)} 
                      title="Reset Password"
                      disabled={loading}
                    >
                      <Key className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEditPermissions(user)} 
                      title="Edit Permissions"
                      disabled={loading}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => toggleUserStatus(user.id)}
                      title={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      disabled={loading}
                    >
                      {user.status === 'Active' ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteUser(user.id)}
                      title="Delete User"
                      disabled={loading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

  {/* Edit User Dialog */}
<Dialog open={editDialog} onOpenChange={setEditDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit User Details</DialogTitle>
      <DialogDescription>Update user information and role</DialogDescription>
    </DialogHeader>
    {selectedUser && (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={selectedUser.name}
            onChange={(e) => setSelectedUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            value={selectedUser.email}
            onChange={(e) => setSelectedUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select 
              value={selectedUser.role} 
              onValueChange={(value: string) => setSelectedUser(prev => prev ? ({ ...prev, role: value }) : null)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allRoles.map(role => (
                  <SelectItem key={role.name} value={role.name}>
                    {role.displayName}
                    {role.isCustom && <Badge variant="outline" className="ml-2">Custom</Badge>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>User Type</Label>
            <Select 
              value={selectedUser.userType} 
              onValueChange={(value: string) => setSelectedUser(prev => prev ? ({ ...prev, userType: value }) : null)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Contractor">Contractor</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    )}
    <DialogFooter>
      <Button variant="outline" onClick={() => setEditDialog(false)} disabled={loading}>
        Cancel
      </Button>
      <Button onClick={saveUserEdit} disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={savePasswordReset} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={permissionsDialog} onOpenChange={setPermissionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            <DialogDescription>
              Modify permissions for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              <Badge variant="outline">
                {editPermissions.length} of {allPermissions.length} selected
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg max-h-96 overflow-y-auto">
              {allPermissions.map(permission => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${permission}`}
                    checked={editPermissions.includes(permission)}
                    onCheckedChange={() => togglePermission(permission)}
                  />
                  <Label
                    htmlFor={`edit-${permission}`}
                    className="text-sm font-normal capitalize cursor-pointer"
                  >
                    {permission.replace('-', ' ')}
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setEditPermissions([...allPermissions])}
              >
                Select All
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setEditPermissions([])}
              >
                Clear All
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={savePermissions} disabled={loading}>
              {loading ? 'Saving...' : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Details Dialog */}
      <Dialog open={roleDetailsDialog} onOpenChange={setRoleDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Role Details</DialogTitle>
            <DialogDescription>
              {selectedRole && `View details and permissions for ${selectedRole.displayName} role`}
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role Name</Label>
                  <p className="font-medium">{selectedRole.displayName}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <Badge variant={selectedRole.isCustom ? "outline" : "secondary"}>
                    {selectedRole.isCustom ? "Custom Role" : "System Role"}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Users with this Role</Label>
                <p className="text-sm text-muted-foreground">
                  {users.filter(u => u.role === selectedRole.name).length} users assigned
                </p>
              </div>

              <div>
                <Label>Permissions ({selectedRole.permissions.length})</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-lg max-h-64 overflow-y-auto">
                  {selectedRole.permissions.map(permission => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>User List</Label>
                <div className="space-y-2 p-4 border rounded-lg max-h-32 overflow-y-auto">
                  {users.filter(u => u.role === selectedRole.name).map(user => (
                    <div key={user.id} className="flex items-center justify-between text-sm">
                      <span>{user.name}</span>
                      <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </div>
                  ))}
                  {users.filter(u => u.role === selectedRole.name).length === 0 && (
                    <p className="text-sm text-muted-foreground">No users assigned to this role</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}