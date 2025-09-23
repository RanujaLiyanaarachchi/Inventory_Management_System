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

export function SupplierReturn() {
  const [returns, setReturns] = useState([
    { id: 'RET-001', supplierId: 'SUP-001', supplier: 'ABC Electronics Ltd', date: '2024-01-15', items: 5, reason: 'Defective', status: 'Processed', amount: 2500.00, notes: 'Multiple units with manufacturing defects' },
    { id: 'RET-002', supplierId: 'SUP-003', supplier: 'Tech Distributors Inc', date: '2024-01-14', items: 2, reason: 'Wrong Item', status: 'Pending', amount: 850.00, notes: 'Items don\'t match the order specifications' },
    { id: 'RET-003', supplierId: 'SUP-007', supplier: 'Global Fashion Co', date: '2024-01-13', items: 8, reason: 'Damaged in Transit', status: 'Approved', amount: 1200.00, notes: 'Packages damaged during shipping' }
  ]);

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
  const [editItem, setEditItem] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [useAutoId, setUseAutoId] = useState(true);

  // Generate return ID
  useEffect(() => {
    if (useAutoId) {
      const newId = `RET-${String(returns.length + 1).padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, id: newId }));
    }
  }, [returns.length, useAutoId]);

  // Filter returns based on search term
  const filteredReturns = returns.filter(item => 
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplierId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addReturn = () => {
    // Validate required fields
    if (!formData.supplierId || !formData.supplier || !formData.reason || !formData.items) {
      toast.error('Please fill all required fields');
      return;
    }

    // Check if ID is unique
    if (returns.some(item => item.id === formData.id)) {
      toast.error('Return ID already exists. Please use a different ID.');
      return;
    }

    // If reason is "Other" but no explanation is provided
    if (formData.reason === 'Other' && !formData.otherReason.trim()) {
      toast.error('Please provide explanation for "Other" reason');
      return;
    }

    const newReturn = {
      id: formData.id,
      supplierId: formData.supplierId,
      supplier: formData.supplier,
      date: new Date().toISOString().split('T')[0],
      items: parseInt(formData.items),
      reason: formData.reason === 'Other' ? `Other: ${formData.otherReason}` : formData.reason,
      status: 'Pending',
      amount: parseFloat(formData.amount) || 0,
      notes: formData.notes
    };

    setReturns(prev => [newReturn, ...prev]);
    
    // Reset form
    setFormData({
      id: useAutoId ? `RET-${String(returns.length + 2).padStart(3, '0')}` : '',
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
  };

  // Handle delete
  const handleDelete = (id: string) => {
    setReturns(prev => prev.filter(item => item.id !== id));
    toast.success('Return request deleted successfully');
  };

  // Open edit dialog
  const handleEdit = (item: any) => {
    setEditItem(item);
    setShowEditDialog(true);
  };

  // Save edited item
  const saveEdit = () => {
    if (!editItem) return;
    
    setReturns(prev => 
      prev.map(item => 
        item.id === editItem.id ? editItem : item
      )
    );
    
    setShowEditDialog(false);
    toast.success('Return request updated successfully');
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
                <Label>Supplier ID *</Label>
                <Input
                  value={formData.supplierId}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                  placeholder="Enter supplier ID (e.g., SUP-001)"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select 
                  value={formData.supplier} 
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, supplier: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABC Electronics Ltd">ABC Electronics Ltd</SelectItem>
                    <SelectItem value="Tech Distributors Inc">Tech Distributors Inc</SelectItem>
                    <SelectItem value="Global Fashion Co">Global Fashion Co</SelectItem>
                  </SelectContent>
                </Select>
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
              <Button onClick={addReturn}>Create Return</Button>
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
                    <TableCell>LKR {returnItem.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        returnItem.status === 'Processed' ? 'default' : 
                        returnItem.status === 'Approved' ? 'secondary' : 'outline'
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
                <Label>Supplier ID</Label>
                <Input 
                  value={editItem?.supplierId || ''} 
                  onChange={(e) => setEditItem({...editItem, supplierId: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select 
                    value={editItem?.supplier || ''} 
                    onValueChange={(value: string) => setEditItem({...editItem, supplier: value})}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ABC Electronics Ltd">ABC Electronics Ltd</SelectItem>
                        <SelectItem value="Tech Distributors Inc">Tech Distributors Inc</SelectItem>
                        <SelectItem value="Global Fashion Co">Global Fashion Co</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editItem?.status || ''} 
                  onValueChange={(value: "Pending" | "Approved" | "Processed" | "Rejected" | "Completed") => setEditItem({...editItem, status: value})}
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
                  onChange={(e) => setEditItem({...editItem, items: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (LKR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editItem?.amount || ''}
                  onChange={(e) => setEditItem({...editItem, amount: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={editItem?.reason || ''}
                onChange={(e) => setEditItem({...editItem, reason: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editItem?.notes || ''}
                onChange={(e) => setEditItem({...editItem, notes: e.target.value})}
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
