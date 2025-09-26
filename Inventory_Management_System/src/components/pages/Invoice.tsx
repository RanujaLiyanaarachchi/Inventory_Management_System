import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Receipt, Plus, Trash2, Eye, Printer, Download, Search, Edit } from 'lucide-react';
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter, DialogClose 
} from "../ui/dialog";

// Firebase imports - updated to include setDoc and doc
import { db } from '../../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy,
  setDoc,
  onSnapshot // Add this for real-time updates
} from 'firebase/firestore';

// Product interface matching your products page
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

interface InvoiceItem {
  productId: string; // Changed to string to match Firebase product IDs
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Invoice {
  id: string; // This will now be the invoiceId (primary key)
  invoiceId: string;
  customer: string;
  customerEmail: string;
  date: string;
  amount: number;
  status: string;
  items: InvoiceItem[];
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export function Invoice() {
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // Products from Firebase
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  
  // Search, edit, and view functionality
  const [productSearch, setProductSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState('Pending');
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch products from Firebase in real-time
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const productsQuery = query(collection(db, 'products'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(productsQuery, 
          (querySnapshot) => {
            const productsData: Product[] = [];
            querySnapshot.forEach((doc) => {
              productsData.push({ id: doc.id, ...doc.data() } as Product);
            });
            // Filter only active products
            const activeProducts = productsData.filter(product => product.status === 'Active');
            setProducts(activeProducts);
            setProductsLoading(false);
          },
          (error) => {
            console.error('Error fetching products:', error);
            toast.error('Error fetching products');
            setProductsLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching products:', error);
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearch.toLowerCase())
  );
  
  // Filter invoices based on search
  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoiceId.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    invoice.customer.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  // Generate next invoice ID
  const generateNextInvoiceId = () => {
    if (invoices.length === 0) return 'INV-001';
    
    const lastInvoice = invoices.reduce((prev, current) => {
      const prevNum = parseInt(prev.invoiceId.split('-')[1]);
      const currentNum = parseInt(current.invoiceId.split('-')[1]);
      return prevNum > currentNum ? prev : current;
    });
    
    const lastNumber = parseInt(lastInvoice.invoiceId.split('-')[1]);
    const nextNumber = lastNumber + 1;
    return `INV-${nextNumber.toString().padStart(3, '0')}`;
  };

  // Fetch invoices from Firebase
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const invoicesQuery = query(collection(db, 'invoices'), orderBy('date', 'desc'));
        const invoiceSnapshot = await getDocs(invoicesQuery);
        const invoicesList = invoiceSnapshot.docs.map(doc => ({
          id: doc.id, // This is now the invoiceId (primary key)
          ...doc.data()
        })) as Invoice[];
        
        setInvoices(invoicesList);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const addItemToInvoice = () => {
    if (!selectedProduct || !quantity) {
      toast.error('Please select a product and quantity');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      toast.error('Selected product not found');
      return;
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (qty > product.stock) {
      toast.error(`Insufficient stock available. Only ${product.stock} units in stock.`);
      return;
    }

    const existingItem = invoiceItems.find(item => item.productId === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + qty;
      if (newQuantity > product.stock) {
        toast.error(`Cannot add more than available stock. Only ${product.stock} units in stock.`);
        return;
      }
      
      setInvoiceItems(prev => prev.map(item =>
        item.productId === product.id
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      ));
    } else {
      const newItem: InvoiceItem = {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        price: product.sellingPrice, // Use selling price from product
        total: qty * product.sellingPrice
      };
      setInvoiceItems(prev => [...prev, newItem]);
    }

    setSelectedProduct('');
    setQuantity('1');
    setProductSearch(''); // Clear search after adding
  };

  const removeItemFromInvoice = (productId: string) => {
    setInvoiceItems(prev => prev.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((total, item) => total + item.total, 0);
  };

  const createOrUpdateInvoice = async () => {
    if (!customerName || invoiceItems.length === 0) {
      toast.error('Please fill in customer details and add items');
      return;
    }

    setLoading(true);
    try {
      const invoiceId = editMode && selectedInvoice ? selectedInvoice.invoiceId : generateNextInvoiceId();
      if (!invoiceId) {
        toast.error('Unable to generate invoice ID');
        return;
      }

      const invoiceData = {
        invoiceId: invoiceId,
        customer: customerName,
        customerEmail: customerEmail,
        date: new Date().toISOString().split('T')[0],
        amount: calculateTotal(),
        status: invoiceStatus,
        items: invoiceItems,
        totalItems: invoiceItems.length,
        createdAt: editMode && selectedInvoice ? selectedInvoice.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editMode) {
        // Update existing invoice in Firebase using invoiceId as document ID
        const invoiceDoc = doc(db, 'invoices', invoiceId);
        await updateDoc(invoiceDoc, {
          ...invoiceData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Invoice updated successfully');
      } else {
        // Create new invoice in Firebase using invoiceId as document ID
        const invoiceDoc = doc(db, 'invoices', invoiceId);
        await setDoc(invoiceDoc, invoiceData);
        toast.success(`Invoice ${invoiceId} created successfully`);
      }

      // Refresh invoices list
      const invoicesQuery = query(collection(db, 'invoices'), orderBy('date', 'desc'));
      const invoiceSnapshot = await getDocs(invoicesQuery);
      const invoicesList = invoiceSnapshot.docs.map(doc => ({
        id: doc.id, // This is the invoiceId (primary key)
        ...doc.data()
      })) as Invoice[];
      setInvoices(invoicesList);

    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
    } finally {
      setLoading(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setInvoiceItems([]);
    setInvoiceStatus('Pending');
    setEditMode(false);
    setEditInvoiceId(null);
    setShowCreateForm(false);
    setSelectedProduct('');
    setQuantity('1');
    setProductSearch('');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setCustomerName(invoice.customer);
    setCustomerEmail(invoice.customerEmail || '');
    setInvoiceStatus(invoice.status);
    setInvoiceItems(invoice.items);
    setSelectedInvoice(invoice);
    setEditMode(true);
    setShowCreateForm(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    setLoading(true);
    try {
      // Use invoiceId as the document ID for deletion
      await deleteDoc(doc(db, 'invoices', invoiceId));
      
      // Refresh invoices list
      const invoicesQuery = query(collection(db, 'invoices'), orderBy('date', 'desc'));
      const invoiceSnapshot = await getDocs(invoicesQuery);
      const invoicesList = invoiceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      setInvoices(invoicesList);
      
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-info { text-align: right; margin-bottom: 40px; }
            .invoice-details { margin-bottom: 30px; }
            .customer-details { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total-section { text-align: right; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; }
            .status { 
              display: inline-block; 
              padding: 5px 10px; 
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-paid { background-color: #d1fae5; color: #047857; }
            .status-pending { background-color: #e5e7eb; color: #4b5563; }
            .status-overdue { background-color: #fee2e2; color: #b91c1c; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
          </div>
          
          <div class="company-info">
            <h2>Your Company Name</h2>
            <p>123 Business Street, City</p>
            <p>Phone: (123) 456-7890</p>
            <p>Email: info@yourcompany.com</p>
          </div>
          
          <div class="invoice-details">
            <p><strong>Invoice Number:</strong> ${invoice.invoiceId}</p>
            <p><strong>Date:</strong> ${invoice.date}</p>
            <p><strong>Status:</strong> <span class="status status-${invoice.status.toLowerCase()}">${invoice.status}</span></p>
          </div>
          
          <div class="customer-details">
            <h3>Bill To:</h3>
            <p><strong>${invoice.customer}</strong></p>
            <p>${invoice.customerEmail || 'No email provided'}</p>
            <p>Customer Address</p>
            <p>City, State, ZIP</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>LKR ${item.price.toFixed(2)}</td>
                  <td>LKR ${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                <td>LKR ${invoice.amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right;"><strong>Tax (0%):</strong></td>
                <td>LKR 0.00</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right;"><strong>Grand Total:</strong></td>
                <td><strong>LKR ${invoice.amount.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="payment-info">
            <h3>Payment Information:</h3>
            <p>Bank: National Bank</p>
            <p>Account: 1234567890</p>
            <p>Payment Terms: Net 30</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>© ${new Date().getFullYear()} Your Company Name</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Trigger print when content is loaded
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
    
    toast.success('Print preview opened');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Pending': return 'secondary';
      case 'Overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">Create and manage customer invoices</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowCreateForm(!showCreateForm);
        }} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Create/Edit Invoice Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {editMode ? `Edit Invoice ${selectedInvoice?.invoiceId}` : 'Create New Invoice'}
            </CardTitle>
            <CardDescription>
              {editMode ? 'Update invoice details' : `New Invoice ID: ${generateNextInvoiceId()}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter customer email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <Label htmlFor="invoiceStatus">Invoice Status</Label>
              <Select value={invoiceStatus} onValueChange={setInvoiceStatus} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Add Items */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Add Items</h3>
              
              {/* Product Search */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                  disabled={loading || productsLoading}
                />
              </div>
              
              <div className="flex gap-4 mb-4">
                <Select 
                  value={selectedProduct} 
                  onValueChange={setSelectedProduct} 
                  disabled={loading || productsLoading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={productsLoading ? "Loading products..." : "Select product"} />
                  </SelectTrigger>
                  <SelectContent>
                    {productsLoading ? (
                      <SelectItem value="loading" disabled>Loading products...</SelectItem>
                    ) : filteredProducts.length === 0 ? (
                      <SelectItem value="no-products" disabled>No products available</SelectItem>
                    ) : (
                      filteredProducts.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - LKR {product.sellingPrice.toFixed(2)} (Stock: {product.stock})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  max={selectedProduct ? products.find(p => p.id === selectedProduct)?.stock || 1 : 1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Qty"
                  className="w-20"
                  disabled={loading || !selectedProduct}
                />
                <Button 
                  onClick={addItemToInvoice} 
                  disabled={loading || !selectedProduct || productsLoading}
                >
                  Add
                </Button>
              </div>

              {/* Invoice Items */}
              {invoiceItems.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map(item => (
                      <TableRow key={item.productId}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>LKR {item.price.toFixed(2)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>LKR {item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItemFromInvoice(item.productId)}
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {invoiceItems.length > 0 && (
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <div className="text-right">
                    <p className="text-lg font-semibold">Total: LKR {calculateTotal().toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={createOrUpdateInvoice} 
                disabled={!customerName || invoiceItems.length === 0 || loading || products.length === 0}
              >
                {loading ? 'Saving...' : editMode ? 'Update Invoice' : 'Create Invoice'}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={loading}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>View and manage customer invoices</CardDescription>
          
          {/* Invoice Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice ID or customer name..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">Loading invoices...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceId}</TableCell>
                      <TableCell>{invoice.customer}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.totalItems} items</TableCell>
                      <TableCell>LKR {invoice.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewInvoice(invoice)} title="View Details" disabled={loading}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditInvoice(invoice)} title="Edit Invoice" disabled={loading}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => printInvoice(invoice)} title="Print Invoice" disabled={loading}>
                            <Printer className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteInvoice(invoice.id)} title="Delete Invoice" disabled={loading}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice Details
            </DialogTitle>
            <DialogDescription>
              Details for invoice {selectedInvoice?.invoiceId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Invoice Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Invoice ID:</span>
                      <span>{selectedInvoice.invoiceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Date:</span>
                      <span>{selectedInvoice.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant={getStatusColor(selectedInvoice.status)}>
                        {selectedInvoice.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Customer:</span>
                      <span>{selectedInvoice.customer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span>{selectedInvoice.customerEmail || 'No email'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Items:</span>
                      <span>{selectedInvoice.totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-semibold">LKR {selectedInvoice.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>LKR {item.price.toFixed(2)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>LKR {item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Actions</h3>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => {
                    handleEditInvoice(selectedInvoice);
                    setShowViewDialog(false);
                  }} className="flex items-center" disabled={loading}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Invoice
                  </Button>
                  <Button size="sm" onClick={() => printInvoice(selectedInvoice)} className="flex items-center" disabled={loading}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}