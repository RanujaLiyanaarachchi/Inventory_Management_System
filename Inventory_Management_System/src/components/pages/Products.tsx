import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  Package, Plus, Edit, Trash2, Image, DollarSign, Search, 
  QrCode, Upload, Eye, X, RefreshCw, Camera
} from 'lucide-react';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const mockProducts = [
  {
    id: 'PRD001',
    name: 'iPhone 14 Pro',
    sku: 'IPH14P-128GB',
    category: 'Electronics',
    supplier: 'ABC Electronics Ltd',
    costPrice: 999,
    sellingPrice: 1299,
    stock: 25,
    minStock: 10,
    status: 'Active',
    barcode: '123456789012',
    imageUrl: null
  },
  {
    id: 'PRD002',
    name: 'Samsung Galaxy S23',
    sku: 'SGS23-256GB',
    category: 'Electronics',
    supplier: 'Tech Distributors Inc',
    costPrice: 799,
    sellingPrice: 1099,
    stock: 15,
    minStock: 5,
    status: 'Active',
    barcode: '123456789013',
    imageUrl: null
  },
  {
    id: 'PRD003',
    name: 'MacBook Pro 14"',
    sku: 'MBP14-512GB',
    category: 'Electronics',
    supplier: 'ABC Electronics Ltd',
    costPrice: 1799,
    sellingPrice: 2099,
    stock: 8,
    minStock: 3,
    status: 'Active',
    barcode: '123456789014',
    imageUrl: null
  }
];

const categories = ['Electronics', 'Clothing', 'Food & Beverages', 'Books', 'Home & Garden'];
const suppliers = ['ABC Electronics Ltd', 'Global Fashion Co', 'Tech Distributors Inc', 'Food Suppliers LLC'];

export function Products() {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    sku: '',
    description: '',
    category: '',
    supplier: '',
    costPrice: '',
    sellingPrice: '',
    minStock: '',
    barcode: '',
    weight: '',
    dimensions: '',
    imageUrl: null as string | null
  });
  interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    supplier: string;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    minStock: number;
    status: string;
    barcode: string;
    imageUrl: string | null;
    description?: string;
    weight?: string;
    dimensions?: string;
  }
  
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedViewProduct, setSelectedViewProduct] = useState<Product | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateProductId = () => {
    const productId = 'PRD' + Math.floor(100 + Math.random() * 900);
    setFormData(prev => ({ ...prev, id: productId }));
  };

  const generateSKU = () => {
    const sku = 'SKU' + Date.now().toString().slice(-6);
    setFormData(prev => ({ ...prev, sku }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        setFormData(prev => ({ 
          ...prev, 
          imageUrl: event.target?.result as string 
        }));
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const simulateBarcodeScanner = () => {
    // In a real application, this would connect to a barcode scanner API
    // For demo purposes, we'll generate a random barcode
    setShowBarcodeScanner(true);
    
    setTimeout(() => {
      const randomBarcode = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
      setFormData(prev => ({ ...prev, barcode: randomBarcode }));
      setShowBarcodeScanner(false);
      toast.success("Barcode scanned successfully");
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.id) {
      generateProductId();
    }

    if (editMode && editId) {
      // Update existing product
      setProducts(prev => prev.map(product => 
        product.id === editId ? {
          ...formData,
          costPrice: parseFloat(formData.costPrice as string) || 0,
          sellingPrice: parseFloat(formData.sellingPrice as string) || 0,
          minStock: parseInt(formData.minStock as string) || 0,
          stock: product.stock, // Preserve existing stock
          status: product.status // Preserve existing status
        } : product
      ));
      toast.success('Product updated successfully');
      setEditMode(false);
      setEditId(null);
    } else {
      // Add new product
      const newProduct = {
        ...formData,
        id: formData.id || `PRD${Date.now().toString().slice(-6)}`,
        costPrice: parseFloat(formData.costPrice as string) || 0,
        sellingPrice: parseFloat(formData.sellingPrice as string) || 0,
        stock: 0,
        minStock: parseInt(formData.minStock as string) || 0,
        status: 'Active'
      };

      setProducts(prev => [...prev, newProduct]);
      toast.success('Product added successfully');
    }

    // Reset form
    setFormData({
      id: '', name: '', sku: '', description: '', category: '', supplier: '',
      costPrice: '', sellingPrice: '', minStock: '', barcode: '', weight: '', dimensions: '',
      imageUrl: null
    });
  };

  const handleEditProduct = (product: any) => {
    setFormData({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category: product.category,
      supplier: product.supplier,
      costPrice: product.costPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      minStock: product.minStock.toString(),
      barcode: product.barcode || '',
      weight: product.weight || '',
      dimensions: product.dimensions || '',
      imageUrl: product.imageUrl
    });
    
    setEditMode(true);
    setEditId(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast.success('Product deleted successfully');
  };

  // Add this function to handle viewing product details
  const handleViewProduct = (product: Product) => {
    setSelectedViewProduct(product);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      {showDetails && selectedViewProduct ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDetails(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
              <h2 className="text-2xl font-semibold">Product Details</h2>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  handleEditProduct(selectedViewProduct);
                  setShowDetails(false);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  deleteProduct(selectedViewProduct.id);
                  setShowDetails(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-[300px_1fr_400px] gap-6">
            {/* Left Column - Image & Basic Info */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="border rounded-lg p-4 bg-muted/5">
                    {selectedViewProduct.imageUrl ? (
                      <img 
                        src={selectedViewProduct.imageUrl} 
                        alt={selectedViewProduct.name} 
                        className="w-48 h-48 mx-auto object-contain rounded-md"
                      />
                    ) : (
                      <div className="w-48 h-48 mx-auto bg-muted rounded-md flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Product ID</p>
                    <p className="font-mono">{selectedViewProduct.id}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-mono">{selectedViewProduct.sku}</p>
                  </div>
                  {selectedViewProduct.barcode && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Barcode</p>
                      <div className="flex items-center gap-2 p-2 border rounded bg-muted/5">
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm">{selectedViewProduct.barcode}</code>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedViewProduct.name}</span>
                    <Badge variant={selectedViewProduct.status === 'Active' ? 'default' : 'secondary'}>
                      {selectedViewProduct.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Category: {selectedViewProduct.category} • Supplier: {selectedViewProduct.supplier}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedViewProduct.description && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Description</h3>
                      <p className="text-muted-foreground">{selectedViewProduct.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="mt-1">{selectedViewProduct.weight ? `${selectedViewProduct.weight} kg` : 'Not specified'}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Dimensions</p>
                      <p className="mt-1">{selectedViewProduct.dimensions || 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Pricing & Stock */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Cost Price</p>
                      <p className="text-2xl font-bold mt-1">LKR {selectedViewProduct.costPrice.toFixed(2)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Selling Price</p>
                      <p className="text-2xl font-bold text-primary mt-1">LKR {selectedViewProduct.sellingPrice.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Profit Margin</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                          {selectedViewProduct.costPrice > 0 
                            ? Math.round(((selectedViewProduct.sellingPrice - selectedViewProduct.costPrice) / selectedViewProduct.costPrice) * 100)
                            : 0}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <p className="text-lg font-medium text-green-600 mt-1">
                          LKR {(selectedViewProduct.sellingPrice - selectedViewProduct.costPrice).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Stock</p>
                      <p className={`text-2xl font-bold mt-1 ${
                        selectedViewProduct.stock <= selectedViewProduct.minStock ? 'text-destructive' : ''
                      }`}>
                        {selectedViewProduct.stock} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Min Stock</p>
                      <p className="text-lg font-medium mt-1">{selectedViewProduct.minStock} units</p>
                    </div>
                  </div>

                  <Badge variant={
                    selectedViewProduct.stock === 0 ? 'destructive' :
                    selectedViewProduct.stock <= selectedViewProduct.minStock ? 'secondary' : 'default'
                  } className="w-full justify-center py-2 text-base">
                    {selectedViewProduct.stock === 0 ? 'Out of Stock' :
                     selectedViewProduct.stock <= selectedViewProduct.minStock ? 'Low Stock' : 'In Stock'}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add/Edit Product Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {editMode ? 'Edit Product' : 'Add New Product'}
              </CardTitle>
              <CardDescription>
                {editMode ? 'Update product information' : 'Add a new product to your inventory'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product ID & SKU */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="id">Product ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="id"
                        value={formData.id}
                        onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                        placeholder="Product ID"
                        disabled={editMode}
                      />
                      {!editMode && (
                        <Button type="button" variant="outline" onClick={generateProductId} title="Generate ID">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="Product SKU"
                        required
                      />
                      <Button type="button" variant="outline" onClick={generateSKU} title="Generate SKU">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <div className="border rounded-md p-4">
                    {formData.imageUrl ? (
                      <div className="relative">
                        <img 
                          src={formData.imageUrl} 
                          alt="Product preview" 
                          className="h-24 w-24 mx-auto object-contain mb-2"
                        />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          className="absolute top-0 right-0" 
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-24 bg-muted/50 rounded-md">
                        <Image className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No image uploaded</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        ref={fileInputRef}
                        title="Upload product image"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {formData.imageUrl ? 'Change Image' : 'Upload Image'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Product description"
                    rows={3}
                  />
                </div>

                {/* Category & Supplier */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select 
                      value={formData.supplier} 
                      onValueChange={(value: string) => setFormData(prev => ({ ...prev, supplier: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price (LKR)</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Selling Price (LKR)</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Min Stock Level</Label>
                    <Input
                      id="minStock"
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Barcode */}
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <div className="flex gap-2">
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      placeholder="Enter barcode"
                      className={showBarcodeScanner ? "border-primary" : ""}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={simulateBarcodeScanner}
                      disabled={showBarcodeScanner}
                    >
                      {showBarcodeScanner ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          <span>Scanning...</span>
                        </div>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 mr-2" />
                          <span>Scan</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions (L x W x H)</Label>
                    <Input
                      id="dimensions"
                      value={formData.dimensions}
                      onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                      placeholder="e.g., 10 x 5 x 3 cm"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full">
                  {editMode ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Product
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </>
                  )}
                </Button>
                
                {editMode && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      setEditMode(false);
                      setEditId(null);
                      setFormData({
                        id: '', name: '', sku: '', description: '', category: '', supplier: '',
                        costPrice: '', sellingPrice: '', minStock: '', barcode: '', weight: '', 
                        dimensions: '', imageUrl: null
                      });
                    }}
                  >
                    Cancel Editing
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Products List Card */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Products Catalog</CardTitle>
              <CardDescription>Manage your product inventory</CardDescription>
              
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, SKU, category, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <div className="h-[calc(100vh-20rem)] overflow-y-auto px-6">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No products found matching your search.
                  </div>
                ) : (
                  <div className="space-y-4 pb-4">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name} 
                                  className="h-16 w-16 object-cover rounded-lg"
                                />
                              ) : (
                                <Image className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="space-y-2 min-w-0">
                              <h4 className="font-medium text-lg truncate">{product.name}</h4>
                              <div className="flex gap-2 text-sm text-muted-foreground">
                                <span>ID: {product.id}</span>
                                <span>•</span>
                                <span className="truncate">SKU: {product.sku}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{product.category}</Badge>
                                <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
                                  {product.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {/* Add the View button */}
                            <Button size="sm" variant="outline" onClick={() => handleViewProduct(product)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deleteProduct(product.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 pt-4 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">Cost Price</p>
                            <p className="font-medium mt-1">LKR {product.costPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Selling Price</p>
                            <p className="font-medium mt-1">LKR {product.sellingPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Stock</p>
                            <p className={`font-medium mt-1 ${product.stock <= product.minStock ? 'text-destructive' : ''}`}>
                              {product.stock} units
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Supplier</p>
                            <p className="font-medium mt-1 truncate">{product.supplier}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <div className="p-4 mt-auto border-t bg-muted/5">
              <p className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}