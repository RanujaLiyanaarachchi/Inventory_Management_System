import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Truck, Plus, Edit, Trash2, Phone, Mail, MapPin, Search } from 'lucide-react';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

const mockSuppliers = [
  {
    id: 1,
    supplierId: 'SUP001',
    name: 'ABC Electronics Ltd',
    email: 'contact@abc-electronics.com',
    phone: '+1 234 567 8900',
    address: '123 Tech Street, Silicon Valley, CA 94105',
    category: 'Electronics',
    status: 'Active',
    paymentTerms: 'Net 30',
    creditLimit: 50000
  },
  {
    id: 2,
    supplierId: 'SUP002',
    name: 'Global Fashion Co',
    email: 'orders@globalfashion.com',
    phone: '+1 234 567 8901',
    address: '456 Fashion Ave, New York, NY 10001',
    category: 'Clothing',
    status: 'Active',
    paymentTerms: 'Net 15',
    creditLimit: 25000
  },
  {
    id: 3,
    supplierId: 'SUP003',
    name: 'Tech Distributors Inc',
    email: 'sales@techdist.com',
    phone: '+1 234 567 8902',
    address: '789 Business Blvd, Austin, TX 78701',
    category: 'Electronics',
    status: 'Inactive',
    paymentTerms: 'Cash on Delivery',
    creditLimit: 75000
  }
];

export function Suppliers() {
  const [formData, setFormData] = useState({
    supplierId: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    contactPerson: '',
    paymentTerms: '',
    creditLimit: '',
    notes: ''
  });
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateSupplierId = () => {
    const id = 'SUP' + String(suppliers.length + 1).padStart(3, '0');
    setFormData(prev => ({ ...prev, supplierId: id }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newSupplier = {
      id: suppliers.length + 1,
      ...formData,
      supplierId: formData.supplierId || `SUP${String(suppliers.length + 1).padStart(3, '0')}`,
      status: 'Active',
      creditLimit: parseFloat(formData.creditLimit) || 0
    };

    if (editMode) {
      setSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? newSupplier : s));
      toast.success('Supplier updated successfully');
      setEditMode(false);
      setSelectedSupplier(null);
    } else {
      setSuppliers(prev => [...prev, newSupplier]);
      toast.success('Supplier added successfully');
    }

    setFormData({
      supplierId: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      contactPerson: '',
      paymentTerms: '',
      creditLimit: '',
      notes: ''
    });
  };

  const deleteSupplier = (supplierId: number) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    toast.success('Supplier deleted successfully');
  };

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setEditMode(true);
    setFormData({
      ...supplier,
      creditLimit: supplier.creditLimit.toString()
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleView = (supplier: any) => {
    setSelectedSupplier(supplier);
    setShowViewDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {editMode ? 'Edit Supplier' : 'Add New Supplier'}
            </CardTitle>
            <CardDescription>
              {editMode ? 'Update supplier information' : 'Register a new supplier for your inventory'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Supplier ID field */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="supplierId">Supplier ID</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="supplierId"
                      value={formData.supplierId}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                      placeholder="Enter supplier ID"
                      disabled={editMode}
                    />
                    {!editMode && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={generateSupplierId}
                      >
                        Generate ID
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="Enter contact person"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                    <Select
                    value={formData.category}
                    onValueChange={(value: string) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                    >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                      <SelectItem value="Food & Beverages">Food & Beverages</SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                      <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select 
                    value={formData.paymentTerms} 
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, paymentTerms: value }))}
                    >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash on Delivery">Cash on Delivery</SelectItem>
                      <SelectItem value="Net 15">Net 15 Days</SelectItem>
                      <SelectItem value="Net 30">Net 30 Days</SelectItem>
                      <SelectItem value="Net 60">Net 60 Days</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit (LKR)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: e.target.value }))}
                  placeholder="Enter credit limit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the supplier"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editMode ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Supplier
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Supplier
                    </>
                  )}
                </Button>
                {editMode && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setSelectedSupplier(null);
                      setFormData({
                        supplierId: '',
                        name: '',
                        email: '',
                        phone: '',
                        address: '',
                        category: '',
                        contactPerson: '',
                        paymentTerms: '',
                        creditLimit: '',
                        notes: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Suppliers List Card */}
        <Card>
          <CardHeader>
            <CardTitle>Suppliers Directory</CardTitle>
            <CardDescription>Manage your supplier network</CardDescription>
            
            {/* Search Bar */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, email, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{supplier.name}</h4>
                      <p className="text-sm text-muted-foreground">ID: {supplier.supplierId}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="outline">{supplier.category}</Badge>
                        <Badge variant={supplier.status === 'Active' ? 'default' : 'secondary'}>
                          {supplier.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(supplier)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteSupplier(supplier.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <span className="text-sm">Payment: {supplier.paymentTerms}</span>
                    <span className="text-sm font-medium">
                      Credit: LKR {supplier.creditLimit?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {filteredSuppliers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No suppliers found matching your search.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          {selectedSupplier && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Supplier Details</DialogTitle>
                <DialogDescription>
                  Viewing complete information for {selectedSupplier.name}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                {/* Add detailed view content here */}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => handleEdit(selectedSupplier)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}