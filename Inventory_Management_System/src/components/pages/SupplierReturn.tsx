import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Undo, Plus, Edit, Trash2, Search, X
} from 'lucide-react';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../firebase';

// Firebase collection names
const SUPPLIER_RETURNS_COLLECTION = 'supplierReturns';
const SUPPLIERS_COLLECTION = 'suppliers';

// Types
interface Supplier {
  supplierId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: 'Active' | 'Inactive';
  contactPerson: string;
  paymentTerms: string;
  creditLimit: number;
  notes: string;
}

interface SupplierReturn {
  id: string;
  supplierId: string;
  supplier: string;
  date: string;
  items: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Processed' | 'Rejected' | 'Completed';
  amount: number;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function SupplierReturn() {
  const [returns, setReturns] = useState<SupplierReturn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    supplierId: '',
    supplier: '',
    reason: '',
    otherReason: '',
    items: '',
    amount: '',
    notes: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<SupplierReturn | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [useAutoId, setUseAutoId] = useState(true);
  const [loading, setLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  // Firebase collection references
  const returnsCollectionRef = collection(db, SUPPLIER_RETURNS_COLLECTION);
  const suppliersCollectionRef = collection(db, SUPPLIERS_COLLECTION);

  // Fetch returns from Firebase
  const fetchReturns = async () => {
    try {
      setLoading(true);
      const q = query(returnsCollectionRef, orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const returnsData: SupplierReturn[] = [];
        querySnapshot.forEach((doc) => {
          returnsData.push({ id: doc.id, ...doc.data() } as SupplierReturn);
        });
        setReturns(returnsData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to fetch return requests');
      setLoading(false);
    }
  };

  // Fetch suppliers from Firebase
  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      const q = query(suppliersCollectionRef, orderBy('name', 'asc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const suppliersData: Supplier[] = [];
        querySnapshot.forEach((doc) => {
          suppliersData.push({ ...doc.data() } as Supplier);
        });
        // Filter only active suppliers
        const activeSuppliers = suppliersData.filter(supplier => supplier.status === 'Active');
        setSuppliers(activeSuppliers);
        setSuppliersLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
      setSuppliersLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchReturns();
    fetchSuppliers();
  }, []);

  // Generate return ID
  const generateReturnId = async () => {
    try {
      const querySnapshot = await getDocs(returnsCollectionRef);
      const count = querySnapshot.size + 1;
      return `RET-${String(count).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating ID:', error);
      return `RET-${String(returns.length + 1).padStart(3, '0')}`;
    }
  };

  // Generate auto ID when form opens or returns change
  useEffect(() => {
    const setAutoId = async () => {
      if (useAutoId && showForm) {
        const newId = await generateReturnId();
        setFormData(prev => ({ ...prev, id: newId }));
      }
    };
    
    setAutoId();
  }, [returns.length, useAutoId, showForm]);

  // Update supplier name when supplierId changes
  useEffect(() => {
    if (formData.supplierId) {
      const selectedSupplier = suppliers.find(sup => sup.supplierId === formData.supplierId);
      if (selectedSupplier) {
        setFormData(prev => ({ ...prev, supplier: selectedSupplier.name }));
      }
    }
  }, [formData.supplierId, suppliers]);

  // Filter returns based on search term
  const filteredReturns = returns.filter(item => 
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplierId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addReturn = async () => {
    // Validate required fields
    if (!formData.supplierId || !formData.supplier || !formData.reason || !formData.items) {
      toast.error('Please fill all required fields');
      return;
    }

    // Check if ID is unique locally (additional safety check)
    if (returns.some(item => item.id === formData.id)) {
      toast.error('Return ID already exists. Please use a different ID.');
      return;
    }

    // If reason is "Other" but no explanation is provided
    if (formData.reason === 'Other' && !formData.otherReason.trim()) {
      toast.error('Please provide explanation for "Other" reason');
      return;
    }

    try {
      const newReturn = {
        supplierId: formData.supplierId,
        supplier: formData.supplier,
        date: new Date().toISOString().split('T')[0],
        items: parseInt(formData.items),
        reason: formData.reason === 'Other' ? `Other: ${formData.otherReason}` : formData.reason,
        status: 'Pending' as const,
        amount: parseFloat(formData.amount) || 0,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to Firebase with the ID as document ID (primary key)
      const docRef = doc(db, SUPPLIER_RETURNS_COLLECTION, formData.id);
      await addDoc(collection(db, SUPPLIER_RETURNS_COLLECTION), {
        ...newReturn,
        id: formData.id // Also store ID as a field for easy querying
      });

      // Reset form
      setFormData({
        id: useAutoId ? await generateReturnId() : '',
        supplierId: '',
        supplier: '',
        reason: '',
        otherReason: '',
        items: '',
        amount: '',
        notes: ''
      });
      
      setShowForm(false);
      toast.success('Return request created successfully');
      
      // Refresh the list
      fetchReturns();
    } catch (error) {
      console.error('Error adding return:', error);
      toast.error('Failed to create return request');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, SUPPLIER_RETURNS_COLLECTION, id));
      toast.success('Return request deleted successfully');
      fetchReturns();
    } catch (error) {
      console.error('Error deleting return:', error);
      toast.error('Failed to delete return request');
    }
  };

  // Open edit dialog
  const handleEdit = (item: SupplierReturn) => {
    setEditItem(item);
    setShowEditDialog(true);
  };

  // Save edited item
  const saveEdit = async () => {
    if (!editItem) return;
    
    try {
      const returnRef = doc(db, SUPPLIER_RETURNS_COLLECTION, editItem.id);
      await updateDoc(returnRef, {
        supplierId: editItem.supplierId,
        supplier: editItem.supplier,
        items: editItem.items,
        reason: editItem.reason,
        amount: editItem.amount,
        status: editItem.status,
        notes: editItem.notes,
        updatedAt: new Date().toISOString()
      });
      
      setShowEditDialog(false);
      toast.success('Return request updated successfully');
      fetchReturns();
    } catch (error) {
      console.error('Error updating return:', error);
      toast.error('Failed to update return request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Supplier Returns</h1>
          <p className="text-muted-foreground">Manage product returns to suppliers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Return
        </Button>
      </div>

      {/* Create Return Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Return Request</CardTitle>
            <CardDescription>Request return of defective or incorrect items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Return ID and Supplier ID Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Return ID *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant={useAutoId ? "default" : "outline"}
                    className="h-7 px-3 text-xs"
                    onClick={() => setUseAutoId(!useAutoId)}
                  >
                    {useAutoId ? "Auto ID: ON" : "Auto ID: OFF"}
                  </Button>
                </div>
                <Input
                  value={formData.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="Enter return ID"
                  disabled={useAutoId}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select 
                  value={formData.supplierId} 
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, supplierId: value }))}
                  disabled={suppliersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={suppliersLoading ? "Loading suppliers..." : "Select supplier"} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length === 0 ? (
                      <SelectItem value="" disabled>
                        {suppliersLoading ? "Loading suppliers..." : "No suppliers available"}
                      </SelectItem>
                    ) : (
                      suppliers.map((supplier) => (
                        <SelectItem key={supplier.supplierId} value={supplier.supplierId}>
                          {supplier.name} ({supplier.supplierId})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {suppliers.length === 0 && !suppliersLoading && (
                  <p className="text-xs text-muted-foreground">
                    No active suppliers found. Please add suppliers first.
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier Name</Label>
                <Input
                  value={formData.supplier}
                  readOnly
                  className="bg-muted/50"
                  placeholder="Supplier name will auto-populate"
                />
              </div>
              <div className="space-y-2">
                <Label>Return Reason *</Label>
                <Select 
                    value={formData.reason} 
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, reason: value }))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Defective">Defective Product</SelectItem>
                        <SelectItem value="Wrong Item">Wrong Item Sent</SelectItem>
                        <SelectItem value="Damaged in Transit">Damaged in Transit</SelectItem>
                        <SelectItem value="Quality Issues">Quality Issues</SelectItem>
                        <SelectItem value="Other">Other (Specify)</SelectItem>
                    </SelectContent>
                </Select>
                
                {formData.reason === 'Other' && (
                  <div className="mt-2">
                    <Input
                      value={formData.otherReason}
                      onChange={(e) => setFormData(prev => ({ ...prev, otherReason: e.target.value }))}
                      placeholder="Please specify the reason"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Items *</Label>
                <Input
                  type="number"
                  placeholder="Enter number of items"
                  value={formData.items}
                  onChange={(e) => setFormData(prev => ({ ...prev, items: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Return Amount (LKR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter return amount"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional details about the return"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={addReturn} disabled={suppliers.length === 0}>
                Create Return
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Undo className="h-5 w-5" />
            Return Requests
          </CardTitle>
          <CardDescription>Track and manage supplier return requests</CardDescription>
          
          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search returns by ID, supplier, reason or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading return requests...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>Supplier ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                      No return requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReturns.map(returnItem => (
                    <TableRow key={returnItem.id}>
                      <TableCell className="font-medium">{returnItem.id}</TableCell>
                      <TableCell>{returnItem.supplierId}</TableCell>
                      <TableCell>{returnItem.supplier}</TableCell>
                      <TableCell>{returnItem.date}</TableCell>
                      <TableCell>{returnItem.items} items</TableCell>
                      <TableCell>{returnItem.reason}</TableCell>
                      <TableCell>LKR {returnItem.amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          returnItem.status === 'Processed' || returnItem.status === 'Completed' ? 'default' : 
                          returnItem.status === 'Approved' ? 'secondary' : 
                          returnItem.status === 'Rejected' ? 'destructive' : 'outline'
                        }>
                          {returnItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(returnItem)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(returnItem.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Return Request</DialogTitle>
            <DialogDescription>
              Update the details of return request {editItem?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Return ID</Label>
                <Input 
                  value={editItem?.id || ''} 
                  readOnly 
                  className="bg-muted/50 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select 
                  value={editItem?.supplierId || ''} 
                  onValueChange={(value: string) => {
                    const selectedSupplier = suppliers.find(sup => sup.supplierId === value);
                    if (selectedSupplier && editItem) {
                      setEditItem({
                        ...editItem,
                        supplierId: value,
                        supplier: selectedSupplier.name
                      });
                    }
                  }}
                  disabled={suppliersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={suppliersLoading ? "Loading suppliers..." : "Select supplier"} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.supplierId} value={supplier.supplierId}>
                        {supplier.name} ({supplier.supplierId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier Name</Label>
                <Input 
                  value={editItem?.supplier || ''} 
                  readOnly 
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editItem?.status || ''} 
                  onValueChange={(value: string) => setEditItem(prev => prev ? {...prev, status: value as any} : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Processed">Processed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Items</Label>
                <Input
                  type="number"
                  value={editItem?.items || ''}
                  onChange={(e) => setEditItem(prev => prev ? {...prev, items: parseInt(e.target.value) || 0} : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (LKR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editItem?.amount || ''}
                  onChange={(e) => setEditItem(prev => prev ? {...prev, amount: parseFloat(e.target.value) || 0} : null)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={editItem?.reason || ''}
                onChange={(e) => setEditItem(prev => prev ? {...prev, reason: e.target.value} : null)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editItem?.notes || ''}
                onChange={(e) => setEditItem(prev => prev ? {...prev, notes: e.target.value} : null)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}