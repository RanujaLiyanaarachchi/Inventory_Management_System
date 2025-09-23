import React, { useState } from 'react';
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

export function Promotions() {
  const [promotions, setPromotions] = useState([
    { id: 1, name: 'Summer Sale', discount: 20, type: 'Percentage', status: 'Active', startDate: '2024-06-01', endDate: '2024-08-31', description: 'Summer season clearance sale' },
    { id: 2, name: 'Electronics Clearance', discount: 15, type: 'Percentage', status: 'Active', startDate: '2024-01-15', endDate: '2024-02-15', description: 'Clear old electronic inventory' },
    { id: 3, name: 'Holiday Special', discount: 50, type: 'Fixed Amount', status: 'Expired', startDate: '2023-12-01', endDate: '2023-12-31', description: 'Holiday season special discount' },
    { id: 4, name: 'New Year Offer', discount: 25, type: 'Percentage', status: 'Upcoming', startDate: '2024-12-30', endDate: '2024-01-05', description: 'New year celebration offer' }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', discount: '', type: 'Percentage', startDate: '', endDate: '', description: ''
  });
  const [editData, setEditData] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  type DiscountType = "Percentage" | "Fixed Amount";
  type PromotionStatus = "Active" | "Upcoming" | "Expired";

  const filteredPromotions = promotions.filter(promo =>
    promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addPromotion = () => {
    if (!formData.name || !formData.discount || !formData.startDate || !formData.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    const newPromotion = {
      id: promotions.length + 1,
      ...formData,
      discount: parseFloat(formData.discount),
      status: new Date(formData.startDate) > new Date() ? 'Upcoming' : 'Active'
    };

    setPromotions(prev => [...prev, newPromotion]);
    setFormData({ name: '', discount: '', type: 'Percentage', startDate: '', endDate: '', description: '' });
    setShowForm(false);
    toast.success('Promotion added successfully');
  };

  const deletePromotion = (id: number) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
    toast.success('Promotion deleted successfully');
  };

  const handleEdit = (promo: any) => {
    setEditData({
      ...promo,
      discount: promo.discount.toString()
    });
    setShowEditDialog(true);
  };

  const updatePromotion = () => {
    if (!editData) return;
    
    if (!editData.name || !editData.discount || !editData.startDate || !editData.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    const updatedPromotion = {
      ...editData,
      discount: parseFloat(editData.discount)
    };

    setPromotions(prev => 
      prev.map(promo => 
        promo.id === editData.id ? updatedPromotion : promo
      )
    );
    
    setShowEditDialog(false);
    setEditData(null);
    toast.success('Promotion updated successfully');
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
                      onChange={(e) => setEditData({ ...editData, discount: e.target.value })}
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
