import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BarChart3, Plus, Minus, Search, Filter, AlertTriangle, Package } from 'lucide-react';
import { toast } from "sonner";

// Firebase imports
import { 
  collection, 
  updateDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where, 
  addDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

// Product interface (from your Products page)
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
  createdAt?: any;
  updatedAt?: any;
}

// GRN Item interface (from your GRN page)
interface GRNItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

// GRN interface (from your GRN page)
interface GRN {
  id: string;
  supplier: string;
  supplierId: string;
  date: string;
  status: string;
  total: number;
  items: number;
  notes?: string;
  itemsList?: GRNItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Supplier Return interface (from your SupplierReturn page)
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

export function Stocks() {
  const [products, setProducts] = useState<Product[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [supplierReturns, setSupplierReturns] = useState<SupplierReturn[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState<{reason: string; note?: string}>({reason: ''});
  const [loading, setLoading] = useState(true);

  // Firebase collection references
  const productsCollectionRef = collection(db, 'products');
  const grnCollectionRef = collection(db, 'grns');
  const supplierReturnsCollectionRef = collection(db, 'supplierReturns');
  const stockMovementsCollectionRef = collection(db, 'stockMovements');

  // Fetch products, GRNs, and supplier returns in real-time
  useEffect(() => {
    setLoading(true);

    // Fetch products
    const productsQuery = query(productsCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData: Product[] = [];
      snapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData);
    });

    // Fetch GRNs
    const grnQuery = query(grnCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribeGrns = onSnapshot(grnQuery, (snapshot) => {
      const grnsData: GRN[] = [];
      snapshot.forEach((doc) => {
        grnsData.push({ id: doc.id, ...doc.data() } as GRN);
      });
      setGrns(grnsData);
    });

    // Fetch supplier returns
    const returnsQuery = query(supplierReturnsCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribeReturns = onSnapshot(returnsQuery, (snapshot) => {
      const returnsData: SupplierReturn[] = [];
      snapshot.forEach((doc) => {
        returnsData.push({ id: doc.id, ...doc.data() } as SupplierReturn);
      });
      setSupplierReturns(returnsData);
    });

    // Set loading to false after initial data load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => {
      unsubscribeProducts();
      unsubscribeGrns();
      unsubscribeReturns();
      clearTimeout(timer);
    };
  }, []);

  // Calculate current stock for each product based on GRNs and Supplier Returns
  const calculateCurrentStock = (product: Product) => {
    let currentStock = product.stock || 0;

    // Add stock from GRNs (goods received)
    grns.forEach(grn => {
      if (grn.status === 'Received' && grn.itemsList) {
        grn.itemsList.forEach(item => {
          // Simple matching by product name - you might want to use product ID or SKU in a real scenario
          if (item.name.toLowerCase().includes(product.name.toLowerCase()) || 
              product.name.toLowerCase().includes(item.name.toLowerCase())) {
            currentStock += item.quantity;
          }
        });
      }
    });

    // Subtract stock from approved supplier returns (goods returned to supplier)
    supplierReturns.forEach(returnItem => {
      if (returnItem.status === 'Approved' || returnItem.status === 'Processed' || returnItem.status === 'Completed') {
        // Simple matching by supplier - you might want more sophisticated matching
        if (returnItem.supplier.toLowerCase().includes(product.supplier.toLowerCase()) ||
            product.supplier.toLowerCase().includes(returnItem.supplier.toLowerCase())) {
          currentStock = Math.max(0, currentStock - returnItem.items);
        }
      }
    });

    return currentStock;
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return 'out-of-stock';
    if (current <= min) return 'low';
    if (current > min * 2) return 'high';
    return 'normal';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const currentStock = calculateCurrentStock(product);
    const status = getStockStatus(currentStock, product.minStock);
    return matchesSearch && status === filterStatus;
  });

  const handleStockAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity || !adjustmentReason.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate reason note for 'other'
    if (adjustmentReason.reason === 'other' && !adjustmentReason.note?.trim()) {
      toast.error('Please provide a note for "Other" reason');
      return;
    }

    const quantity = parseInt(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      const productDocRef = doc(db, 'products', selectedProduct);
      const product = products.find(p => p.id === selectedProduct);
      
      if (!product) {
        toast.error('Product not found');
        return;
      }

      const currentStock = calculateCurrentStock(product);
      let newStock;

      if (adjustmentType === 'add') {
        newStock = currentStock + quantity;
        // Update the base stock in the product document
        await updateDoc(productDocRef, {
          stock: (product.stock || 0) + quantity,
          updatedAt: serverTimestamp()
        });
      } else {
        newStock = Math.max(0, currentStock - quantity);
        // Update the base stock in the product document
        const updatedBaseStock = Math.max(0, (product.stock || 0) - quantity);
        await updateDoc(productDocRef, {
          stock: updatedBaseStock,
          updatedAt: serverTimestamp()
        });
      }

      // Create stock movement record
      await addDoc(stockMovementsCollectionRef, {
        productId: selectedProduct,
        productName: product.name,
        productSku: product.sku,
        type: adjustmentType,
        quantity: quantity,
        reason: adjustmentReason.reason,
        note: adjustmentReason.note,
        previousStock: currentStock,
        newStock: newStock,
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0],
        adjustedBy: 'Manual Adjustment' // In a real app, this would be the user's name
      });

      setSelectedProduct(null);
      setAdjustmentQuantity('');
      setAdjustmentReason({reason: ''});
      toast.success(`Stock ${adjustmentType === 'add' ? 'added' : 'removed'} successfully`);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    }
  };

  const calculateTotalStockValue = () => {
    return products.reduce((total, product) => {
      const currentStock = calculateCurrentStock(product);
      return total + (currentStock * product.costPrice);
    }, 0);
  };

  const calculateStockMovementsThisMonth = () => {
    // This would typically come from stockMovements collection
    // For now, we'll calculate based on recent GRNs and returns
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyMovements = grns.filter(grn => {
      const grnDate = new Date(grn.date);
      return grnDate.getMonth() === currentMonth && grnDate.getFullYear() === currentYear;
    }).length + supplierReturns.filter(ret => {
      const retDate = new Date(ret.date);
      return retDate.getMonth() === currentMonth && retDate.getFullYear() === currentYear;
    }).length;

    return monthlyMovements;
  };

  const lowStockCount = products.filter(product => {
    const currentStock = calculateCurrentStock(product);
    return getStockStatus(currentStock, product.minStock) === 'low' || 
           getStockStatus(currentStock, product.minStock) === 'out-of-stock';
  }).length;

  const outOfStockCount = products.filter(product => {
    const currentStock = calculateCurrentStock(product);
    return getStockStatus(currentStock, product.minStock) === 'out-of-stock';
  }).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Products in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              {outOfStockCount > 0 ? `${outOfStockCount} out of stock` : 'Low stock items'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {calculateTotalStockValue().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Movements</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateStockMovementsThisMonth()}</div>
            <p className="text-xs text-muted-foreground">Movements this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stock Inventory</CardTitle>
            <CardDescription>
              Real-time stock levels from GRN receipts and supplier returns
            </CardDescription>
            
            {/* Search and Filter */}
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, SKU, category, or supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="normal">Normal Stock</SelectItem>
                  <SelectItem value="high">High Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {products.length === 0 ? 'No products found. Add products first.' : 'No products match your search criteria.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const currentStock = calculateCurrentStock(product);
                      const status = getStockStatus(currentStock, product.minStock);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                          <TableCell>
                            <span className={
                              status === 'out-of-stock' ? 'text-destructive font-bold' :
                              status === 'low' ? 'text-destructive font-medium' : ''
                            }>
                              {currentStock} units
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{product.minStock} units</TableCell>
                          <TableCell>{product.supplier}</TableCell>
                          <TableCell>
                            <Badge variant={
                              status === 'out-of-stock' ? 'destructive' : 
                              status === 'low' ? 'destructive' : 
                              status === 'high' ? 'secondary' : 'default'
                            }>
                              {status === 'out-of-stock' ? 'Out of Stock' : 
                               status === 'low' ? 'Low Stock' : 
                               status === 'high' ? 'High Stock' : 'Normal'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedProduct(product.id)}
                            >
                              Adjust
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Stock Adjustment Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Stock Adjustment</CardTitle>
            <CardDescription>Add or remove stock for selected product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProduct ? (
              <>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">
                    {products.find(p => p.id === selectedProduct)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {products.find(p => p.id === selectedProduct)?.sku}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current Stock: {calculateCurrentStock(products.find(p => p.id === selectedProduct)!)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Base Stock: {products.find(p => p.id === selectedProduct)?.stock}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Adjustment Type</Label>
                  <Select value={adjustmentType} onValueChange={(value: 'add' | 'remove') => setAdjustmentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add Stock</SelectItem>
                      <SelectItem value="remove">Remove Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Select 
                    value={adjustmentReason.reason} 
                    onValueChange={(value: "received" | "sold" | "damaged" | "expired" | "returned" | "audit" | "other" | "") => setAdjustmentReason({reason: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="received">Stock Received</SelectItem>
                      <SelectItem value="sold">Stock Sold</SelectItem>
                      <SelectItem value="damaged">Damaged/Defective</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="returned">Customer Return</SelectItem>
                      <SelectItem value="audit">Stock Audit</SelectItem>
                      <SelectItem value="other">Other (add note below)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Show note input only if reason is "other" */}
                {adjustmentReason.reason === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="note" className="font-semibold text-destructive">Note (required for 'Other')</Label>
                    <Input
                      id="note"
                      value={adjustmentReason.note || ''}
                      onChange={(e) => setAdjustmentReason({ ...adjustmentReason, note: e.target.value })}
                      placeholder="Enter reason note"
                      required
                    />
                    <p className="text-xs text-muted-foreground">A note is required when selecting "Other" as the reason.</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleStockAdjustment} className="flex-1">
                    {adjustmentType === 'add' ? <Plus className="h-4 w-4 mr-2" /> : <Minus className="h-4 w-4 mr-2" />}
                    {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setSelectedProduct(null);
                    setAdjustmentQuantity('');
                    setAdjustmentReason({reason: ''});
                  }}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a product to adjust stock</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}