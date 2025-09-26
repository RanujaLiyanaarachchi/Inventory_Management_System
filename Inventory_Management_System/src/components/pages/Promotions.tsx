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
  Percent, Search, Plus, Edit, Trash2
} from 'lucide-react';
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "../ui/dialog";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  onSnapshot,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase';

// Interface definitions
interface Promotion {
  id: string;
  name: string;
  discount: number;
  type: "Percentage" | "Fixed Amount";
  status: "Active" | "Upcoming" | "Expired";
  startDate: string;
  endDate: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FormData {
  name: string;
  discount: string;
  type: "Percentage" | "Fixed Amount";
  startDate: string;
  endDate: string;
  description: string;
}

export function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '', discount: '', type: 'Percentage', startDate: '', endDate: '', description: ''
  });
  const [editData, setEditData] = useState<Promotion | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  type DiscountType = "Percentage" | "Fixed Amount";
  type PromotionStatus = "Active" | "Upcoming" | "Expired";

  // Firebase collection reference
  const promotionsCollectionRef = collection(db, 'promotions');

  // Fetch promotions from Firebase with real-time updates
  useEffect(() => {
    setLoading(true);
    
    // Create a query with ordering
    const q = query(promotionsCollectionRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promotionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Promotion[];
      setPromotions(promotionsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching promotions: ', error);
      toast.error('Error loading promotions');
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const filteredPromotions = promotions.filter(promo =>
    promo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addPromotion = async () => {
    if (!formData.name || !formData.discount || !formData.startDate || !formData.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      // Determine status based on start date
      const status = new Date(formData.startDate) > new Date() ? 'Upcoming' : 'Active';
      
      // Add document to Firestore - Firebase will automatically generate the ID
      await addDoc(promotionsCollectionRef, {
        name: formData.name,
        discount: parseFloat(formData.discount),
        type: formData.type,
        status: status,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Reset form
      setFormData({ name: '', discount: '', type: 'Percentage', startDate: '', endDate: '', description: '' });
      setShowForm(false);
      toast.success('Promotion added successfully');
    } catch (error) {
      console.error('Error adding promotion: ', error);
      toast.error('Error adding promotion');
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      // Use the Firebase document ID to delete
      const promotionDoc = doc(db, 'promotions', id);
      await deleteDoc(promotionDoc);
      toast.success('Promotion deleted successfully');
    } catch (error) {
      console.error('Error deleting promotion: ', error);
      toast.error('Error deleting promotion');
    }
  };

  const handleEdit = (promo: Promotion) => {
    setEditData({
      ...promo,
      discount: promo.discount // Keep as number for consistency
    });
    setShowEditDialog(true);
  };

  const updatePromotion = async () => {
    if (!editData) return;
    
    if (!editData.name || !editData.discount || !editData.startDate || !editData.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      // Use the Firebase document ID to update
      const promotionDoc = doc(db, 'promotions', editData.id);
      await updateDoc(promotionDoc, {
        name: editData.name,
        discount: editData.discount,
        type: editData.type,
        status: editData.status,
        startDate: editData.startDate,
        endDate: editData.endDate,
        description: editData.description,
        updatedAt: new Date()
      });
      
      setShowEditDialog(false);
      setEditData(null);
      toast.success('Promotion updated successfully');
    } catch (error) {
      console.error('Error updating promotion: ', error);
      toast.error('Error updating promotion');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Promotions Management</h1>
          <p className="text-muted-foreground">Manage discounts and promotional offers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Promotion
        </Button>
      </div>

      {/* Add Promotion Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Promotion</CardTitle>
            <CardDescription>Add a new promotional offer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Promotion Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter promotion name"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                    placeholder="Enter discount value"
                  />
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: DiscountType) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Percentage">%</SelectItem>
                      <SelectItem value="Fixed Amount">LKR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter promotion description"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={addPromotion}>Add Promotion</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promotions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Active Promotions
          </CardTitle>
          <CardDescription>Manage your promotional campaigns</CardDescription>
          
          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search promotions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading promotions...</div>
          ) : filteredPromotions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {promotions.length === 0 ? 'No promotions found. Add your first promotion!' : 'No promotions match your search.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promotion Name</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromotions.map(promo => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{promo.name}</p>
                        <p className="text-sm text-muted-foreground">{promo.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>{promo.discount}{promo.type === 'Percentage' ? '%' : ' LKR'}</TableCell>
                    <TableCell>{promo.type}</TableCell>
                    <TableCell>{promo.startDate}</TableCell>
                    <TableCell>{promo.endDate}</TableCell>
                    <TableCell>
                      <Badge variant={
                        promo.status === 'Active' ? 'default' : 
                        promo.status === 'Upcoming' ? 'secondary' : 'outline'
                      }>
                        {promo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(promo)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deletePromotion(promo.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Promotion Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Promotion
            </DialogTitle>
            <DialogDescription>
              Update information for promotion
            </DialogDescription>
          </DialogHeader>
          
          {editData && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Promotion Name *</Label>
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder="Enter promotion name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={editData.discount}
                      onChange={(e) => setEditData({ ...editData, discount: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter discount value"
                    />
                    <Select 
                      value={editData.type} 
                      onValueChange={(value: DiscountType) => setEditData({ ...editData, type: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Percentage">%</SelectItem>
                        <SelectItem value="Fixed Amount">LKR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={editData.startDate}
                    onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input
                    type="date"
                    value={editData.endDate}
                    onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={editData.status} 
                    onValueChange={(value: PromotionStatus) => setEditData({ ...editData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    placeholder="Enter promotion description"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-end gap-2">
            <Button onClick={updatePromotion}>
              <Edit className="h-4 w-4 mr-2" />
              Update Promotion
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}