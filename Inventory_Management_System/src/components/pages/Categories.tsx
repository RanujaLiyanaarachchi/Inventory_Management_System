import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tag, Plus, Edit, Trash2, Package } from 'lucide-react';
import { toast } from "sonner";

const mockCategories = [
  { id: 1, name: 'Electronics', description: 'Electronic devices and accessories', productCount: 156, status: 'Active', createdDate: '2024-01-01' },
  { id: 2, name: 'Clothing', description: 'Apparel and fashion items', productCount: 89, status: 'Active', createdDate: '2024-01-02' },
  { id: 3, name: 'Food & Beverages', description: 'Food items and drinks', productCount: 234, status: 'Active', createdDate: '2024-01-03' },
  { id: 4, name: 'Books', description: 'Books and educational materials', productCount: 67, status: 'Active', createdDate: '2024-01-04' },
  { id: 5, name: 'Home & Garden', description: 'Home improvement and garden supplies', productCount: 123, status: 'Active', createdDate: '2024-01-05' },
  { id: 6, name: 'Sports', description: 'Sports equipment and accessories', productCount: 45, status: 'Inactive', createdDate: '2024-01-06' }
];

export function Categories() {
  const [categories, setCategories] = useState(mockCategories);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [editingCategory, setEditingCategory] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter a category name');
      return;
    }

    if (editingCategory) {
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory 
          ? { ...cat, ...formData }
          : cat
      ));
      setEditingCategory(null);
      toast.success('Category updated successfully');
    } else {
      const newCategory = {
        id: categories.length + 1,
        ...formData,
        productCount: 0,
        status: 'Active',
        createdDate: new Date().toISOString().split('T')[0]
      };
      setCategories(prev => [...prev, newCategory]);
      toast.success('Category added successfully');
    }

    setFormData({ name: '', description: '' });
  };

  const editCategory = (category: typeof mockCategories[0]) => {
    setFormData({
      name: category.name,
      description: category.description
    });
    setEditingCategory(category.id);
  };

  const deleteCategory = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && category.productCount > 0) {
      toast.error('Cannot delete category with existing products');
      return;
    }
    
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    toast.success('Category deleted successfully');
  };

  const toggleStatus = (categoryId: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, status: cat.status === 'Active' ? 'Inactive' : 'Active' }
        : cat
    ));
    toast.success('Category status updated');
  };

  const totalProducts = categories.reduce((total, cat) => total + cat.productCount, 0);
  const activeCategories = categories.filter(cat => cat.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Tag className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCategories}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add/Edit Category Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </CardTitle>
            <CardDescription>
              {editingCategory ? 'Update category information' : 'Create a new product category'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </Button>
                {editingCategory && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingCategory(null);
                      setFormData({ name: '', description: '' });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Categories List */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage your product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{category.name}</h4>
                        <Badge variant={category.status === 'Active' ? 'default' : 'secondary'}>
                          {category.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {category.description || 'No description provided'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {category.productCount} products
                        </span>
                        <span>Created: {category.createdDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => editCategory(category)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => toggleStatus(category.id)}
                    >
                      {category.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteCategory(category.id)}
                      disabled={category.productCount > 0}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}