import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BarChart3, Plus, Minus, Search, Filter, AlertTriangle, Package } from 'lucide-react';
import { toast } from "sonner";

const mockStocks = [
  { id: 1, name: 'iPhone 14 Pro', sku: 'IPH14P-128GB', currentStock: 25, minStock: 10, maxStock: 100, location: 'A1-B2', lastUpdated: '2024-01-15' },
  { id: 2, name: 'Samsung Galaxy S23', sku: 'SGS23-256GB', currentStock: 5, minStock: 10, maxStock: 50, location: 'A2-C1', lastUpdated: '2024-01-14' },
  { id: 3, name: 'MacBook Pro 14"', sku: 'MBP14-512GB', currentStock: 8, minStock: 5, maxStock: 25, location: 'B1-A3', lastUpdated: '2024-01-13' },
  { id: 4, name: 'Dell XPS 13', sku: 'DXP13-256GB', currentStock: 15, minStock: 8, maxStock: 30, location: 'B2-B1', lastUpdated: '2024-01-12' },
  { id: 5, name: 'iPad Air', sku: 'IPA-128GB', currentStock: 2, minStock: 5, maxStock: 40, location: 'C1-A2', lastUpdated: '2024-01-11' }
];

export function Stocks() {
  const [stocks, setStocks] = useState(mockStocks);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStock, setSelectedStock] = useState<number | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState<{reason: string; note?: string}>({reason: ''});

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current <= min) return 'low';
    if (current >= max * 0.9) return 'high';
    return 'normal';
  };

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const status = getStockStatus(stock.currentStock, stock.minStock, stock.maxStock);
    return matchesSearch && status === filterStatus;
  });

  const handleStockAdjustment = () => {
    if (!selectedStock || !adjustmentQuantity || !adjustmentReason.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    const quantity = parseInt(adjustmentQuantity);
    setStocks(prev => prev.map(stock => {
      if (stock.id === selectedStock) {
        const newStock = adjustmentType === 'add' 
          ? stock.currentStock + quantity 
          : Math.max(0, stock.currentStock - quantity);
        
        return {
          ...stock,
          currentStock: newStock,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return stock;
    }));

    setSelectedStock(null);
    setAdjustmentQuantity('');
    setAdjustmentReason({reason: ''});
    toast.success(`Stock ${adjustmentType === 'add' ? 'added' : 'removed'} successfully`);
  };

  const lowStockCount = stocks.filter(stock => 
    getStockStatus(stock.currentStock, stock.minStock, stock.maxStock) === 'low'
  ).length;

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
            <div className="text-2xl font-bold">{stocks.length}</div>
            <p className="text-xs text-muted-foreground">Active products in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Products below minimum level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$127,450</div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Movements</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">Movements this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stock Inventory</CardTitle>
            <CardDescription>Manage your product stock levels</CardDescription>
            
            {/* Search and Filter */}
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
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
                    <TableHead>Current</TableHead>
                    <TableHead>Min/Max</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStocks.map((stock) => {
                    const status = getStockStatus(stock.currentStock, stock.minStock, stock.maxStock);
                    return (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">{stock.name}</TableCell>
                        <TableCell className="text-muted-foreground">{stock.sku}</TableCell>
                        <TableCell>
                          <span className={status === 'low' ? 'text-destructive font-medium' : ''}>{stock.currentStock}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{stock.minStock}/{stock.maxStock}</TableCell>
                        <TableCell>{stock.location}</TableCell>
                        <TableCell>
                          <Badge variant={
                            status === 'low' ? 'destructive' : 
                            status === 'high' ? 'secondary' : 'default'
                          }>
                            {status === 'low' ? 'Low Stock' : status === 'high' ? 'High Stock' : 'Normal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedStock(stock.id)}
                          >
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Stock Adjustment Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Adjustment</CardTitle>
            <CardDescription>Add or remove stock for selected product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedStock ? (
              <>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">
                    {stocks.find(s => s.id === selectedStock)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current Stock: {stocks.find(s => s.id === selectedStock)?.currentStock} units
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
                  <Button variant="outline" onClick={() => setSelectedStock(null)}>
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