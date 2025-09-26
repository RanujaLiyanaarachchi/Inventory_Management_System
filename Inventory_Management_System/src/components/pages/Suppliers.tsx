import React, { useState, useEffect } from 'react';
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
import { 
  collection, 
  doc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  setDoc,
  getDoc,
  updateDoc,
  getDocs  // Added getDocs import
} from 'firebase/firestore';
import { db } from '../../firebase';

// Firebase collection names
const SUPPLIERS_COLLECTION = 'suppliers';
const CATEGORIES_COLLECTION = 'categories';

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
  createdAt?: Date;
  updatedAt?: Date;
}

interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  status: 'Active' | 'Inactive';
  createdDate: string;
}

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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch suppliers from Firebase
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const q = query(collection(db, SUPPLIERS_COLLECTION), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const suppliersData: Supplier[] = [];
          querySnapshot.forEach((doc) => {
            suppliersData.push({ ...doc.data() } as Supplier);
          });
          setSuppliers(suppliersData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        toast.error('Failed to fetch suppliers');
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch categories from Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, CATEGORIES_COLLECTION));
        const unsubscribe = onSnapshot(q, 
          (querySnapshot) => {
            const categoriesData: Category[] = [];
            querySnapshot.forEach((doc) => {
              categoriesData.push({ id: doc.id, ...doc.data() } as Category);
            });
            // Filter only active categories and sort by name
            const activeCategories = categoriesData
              .filter(cat => cat.status === 'Active')
              .sort((a, b) => a.name.localeCompare(b.name));
            setCategories(activeCategories);
            setCategoriesLoading(false);
          },
          (error) => {
            console.error('Error fetching categories:', error);
            toast.error('Error fetching categories');
            setCategoriesLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateSupplierId = async () => {
    try {
      const suppliersQuery = query(collection(db, SUPPLIERS_COLLECTION));
      const querySnapshot = await getDocs(suppliersQuery);
      const nextId = 'SUP' + String(querySnapshot.size + 1).padStart(3, '0');
      
      // Check if the generated ID already exists
      const docRef = doc(db, SUPPLIERS_COLLECTION, nextId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // If exists, find the next available ID
        let newId = nextId;
        let counter = querySnapshot.size + 1;
        while (true) {
          counter++;
          newId = 'SUP' + String(counter).padStart(3, '0');
          const checkDocRef = doc(db, SUPPLIERS_COLLECTION, newId);
          const checkDocSnap = await getDoc(checkDocRef);
          if (!checkDocSnap.exists()) break;
        }
        setFormData(prev => ({ ...prev, supplierId: newId }));
      } else {
        setFormData(prev => ({ ...prev, supplierId: nextId }));
      }
    } catch (error) {
      console.error('Error generating supplier ID:', error);
      toast.error('Failed to generate supplier ID');
    }
  };

  const checkSupplierIdExists = async (supplierId: string): Promise<boolean> => {
    try {
      const docRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking supplier ID:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.supplierId) {
      toast.error('Please generate or enter a Supplier ID');
      return;
    }

    try {
      const supplierData = {
        supplierId: formData.supplierId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        category: formData.category,
        contactPerson: formData.contactPerson,
        paymentTerms: formData.paymentTerms,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        notes: formData.notes,
        status: 'Active' as const,
        updatedAt: new Date()
      };

      if (editMode && selectedSupplier) {
        // Update existing supplier
        if (formData.supplierId !== selectedSupplier.supplierId) {
          // If supplier ID changed, we need to delete old document and create new one
          await deleteDoc(doc(db, SUPPLIERS_COLLECTION, selectedSupplier.supplierId));
          
          const newDocRef = doc(db, SUPPLIERS_COLLECTION, formData.supplierId);
          await setDoc(newDocRef, {
            ...supplierData,
            createdAt: selectedSupplier.createdAt || new Date()
          });
        } else {
          // Same supplier ID, just update the document
          const supplierDoc = doc(db, SUPPLIERS_COLLECTION, formData.supplierId);
          await updateDoc(supplierDoc, supplierData);
        }
        
        toast.success('Supplier updated successfully');
        setEditMode(false);
        setSelectedSupplier(null);
      } else {
        // Add new supplier - check if supplier ID already exists
        const exists = await checkSupplierIdExists(formData.supplierId);
        if (exists) {
          toast.error('Supplier ID already exists. Please use a different ID.');
          return;
        }

        const newDocRef = doc(db, SUPPLIERS_COLLECTION, formData.supplierId);
        await setDoc(newDocRef, {
          ...supplierData,
          createdAt: new Date()
        });
        toast.success('Supplier added successfully');
      }

      // Reset form
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
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Failed to save supplier');
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    try {
      await deleteDoc(doc(db, SUPPLIERS_COLLECTION, supplierId));
      toast.success('Supplier deleted successfully');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setEditMode(true);
    setFormData({
      supplierId: supplier.supplierId,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      category: supplier.category,
      contactPerson: supplier.contactPerson,
      paymentTerms: supplier.paymentTerms,
      creditLimit: supplier.creditLimit.toString(),
      notes: supplier.notes
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleView = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowViewDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading suppliers...</p>
        </div>
      </div>
    );
  }

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
                  <Label htmlFor="supplierId">Supplier ID *</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="supplierId"
                      value={formData.supplierId}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value.toUpperCase() }))}
                      placeholder="Enter supplier ID"
                      required
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
                      <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <SelectItem value="" disabled>
                          {categoriesLoading ? "Loading categories..." : "No categories available"}
                        </SelectItem>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                      {categories.length > 0 && (
                        <SelectItem value="Other">Other</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {categories.length === 0 && !categoriesLoading && (
                    <p className="text-xs text-muted-foreground">
                      No active categories found. Please add categories first.
                    </p>
                  )}
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
                <div key={supplier.supplierId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
                      <Button size="sm" variant="outline" onClick={() => deleteSupplier(supplier.supplierId)}>
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
                  {suppliers.length === 0 ? 'No suppliers found. Add your first supplier!' : 'No suppliers found matching your search.'}
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