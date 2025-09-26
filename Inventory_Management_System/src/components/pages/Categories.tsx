import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tag, Plus, Edit, Trash2, Package, Key } from 'lucide-react';
import { toast } from "sonner";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust the path to your firebase config

// Firebase collection name
const CATEGORIES_COLLECTION = 'categories';

// Type for category data
interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  status: 'Active' | 'Inactive';
  createdDate: string;
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: ''
  });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [idError, setIdError] = useState('');

  // Fetch categories from Firebase in real-time
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, CATEGORIES_COLLECTION));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const categoriesData: Category[] = [];
        querySnapshot.forEach((doc) => {
          categoriesData.push({ id: doc.id, ...doc.data() } as Category);
        });
        // Sort categories by creation date or name
        categoriesData.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(categoriesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching categories:', error);
        toast.error('Error fetching categories');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Validate category ID format
  const validateCategoryId = (id: string): boolean => {
    const idRegex = /^[a-zA-Z0-9_-]+$/;
    return idRegex.test(id) && id.length >= 2 && id.length <= 30;
  };

  // Check if category ID already exists
  const checkCategoryIdExists = async (id: string): Promise<boolean> => {
    if (!id) return false;
    try {
      const docRef = doc(db, CATEGORIES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking category ID:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id) {
      toast.error('Please enter a category ID');
      return;
    }

    if (!formData.name) {
      toast.error('Please enter a category name');
      return;
    }

    if (!validateCategoryId(formData.id)) {
      toast.error('Category ID must be 2-30 characters long and can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    setLoading(true);

    try {
      if (editingCategory) {
        // Update existing category in Firebase
        const categoryRef = doc(db, CATEGORIES_COLLECTION, editingCategory);
        await updateDoc(categoryRef, {
          name: formData.name,
          description: formData.description,
          updatedAt: new Date().toISOString()
        });
        setEditingCategory(null);
        toast.success('Category updated successfully');
      } else {
        // Check if category ID already exists
        const idExists = await checkCategoryIdExists(formData.id);
        if (idExists) {
          toast.error('Category ID already exists. Please choose a different one.');
          setLoading(false);
          return;
        }

        // Add new category to Firebase with custom ID
        const categoryRef = doc(db, CATEGORIES_COLLECTION, formData.id);
        await setDoc(categoryRef, {
          name: formData.name,
          description: formData.description,
          productCount: 0,
          status: 'Active',
          createdDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
        toast.success('Category added successfully');
      }

      setFormData({ id: '', name: '', description: '' });
      setIdError('');
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Error saving category');
    } finally {
      setLoading(false);
    }
  };

  const editCategory = (category: Category) => {
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description
    });
    setEditingCategory(category.id);
  };

  const deleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && category.productCount > 0) {
      toast.error('Cannot delete category with existing products');
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Error deleting category');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    setLoading(true);
    try {
      const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
      await updateDoc(categoryRef, {
        status: category.status === 'Active' ? 'Inactive' : 'Active',
        updatedAt: new Date().toISOString()
      });
      toast.success('Category status updated');
    } catch (error) {
      console.error('Error updating category status:', error);
      toast.error('Error updating category status');
    } finally {
      setLoading(false);
    }
  };

  const handleIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value;
    setFormData(prev => ({ ...prev, id: newId }));

    // Validate ID format
    if (newId && !validateCategoryId(newId)) {
      setIdError('Category ID must be 2-30 characters long and can only contain letters, numbers, hyphens, and underscores');
    } else {
      setIdError('');
    }

    // Check if ID exists (only for new categories, not when editing)
    if (newId && !editingCategory) {
      const exists = await checkCategoryIdExists(newId);
      if (exists) {
        setIdError('Category ID already exists');
      } else if (!idError) {
        setIdError('');
      }
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setFormData({ id: '', name: '', description: '' });
    setIdError('');
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
                <Label htmlFor="id" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Category ID *
                </Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={handleIdChange}
                  placeholder="Enter unique category ID (e.g., electronics, clothing)"
                  required
                  disabled={loading || editingCategory !== null}
                  className={idError ? 'border-red-500' : ''}
                />
                {idError && (
                  <p className="text-sm text-red-500">{idError}</p>
                )}
                {!editingCategory && !idError && formData.id && (
                  <p className="text-sm text-green-500">Category ID is available</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Unique identifier (2-30 characters, letters, numbers, hyphens, underscores only)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  required
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={loading || !!idError}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
                </Button>
                {editingCategory && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelEdit}
                    disabled={loading}
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
              {loading && categories.length === 0 ? (
                <div className="text-center py-4">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-4">No categories found. Add your first category!</div>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{category.name}</h4>
                          <Badge variant={category.status === 'Active' ? 'default' : 'secondary'}>
                            {category.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1">
                            <Key className="h-3 w-3" />
                            ID: {category.id}
                          </span>
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
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => editCategory(category)}
                        disabled={loading}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => toggleStatus(category.id)}
                        disabled={loading}
                      >
                        {category.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteCategory(category.id)}
                        disabled={category.productCount > 0 || loading}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}