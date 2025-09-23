import React, { useState } from 'react';
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

const mockInvoices = [
  { id: 'INV-001', customer: 'John Smith', date: '2024-01-15', amount: 1299.99, status: 'Paid', items: 3 },
  { id: 'INV-002', customer: 'Sarah Johnson', date: '2024-01-14', amount: 849.50, status: 'Pending', items: 2 },
  { id: 'INV-003', customer: 'Mike Wilson', date: '2024-01-13', amount: 2100.00, status: 'Paid', items: 5 },
  { id: 'INV-004', customer: 'Emma Davis', date: '2024-01-12', amount: 679.99, status: 'Overdue', items: 1 }
];

const mockProducts = [
  { id: 1, name: 'iPhone 14 Pro', price: 1299.99, stock: 25 },
  { id: 2, name: 'Samsung Galaxy S23', price: 1099.99, stock: 15 },
  { id: 3, name: 'MacBook Pro 14"', price: 2099.99, stock: 8 },
  { id: 4, name: 'iPad Air', price: 649.99, stock: 12 }
];

interface InvoiceItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export function Invoice() {
  // Existing state
  const [invoices, setInvoices] = useState(mockInvoices);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  
  // New state for search, edit, and view functionality
  const [productSearch, setProductSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceStatus, setInvoiceStatus] = useState('Pending');

  // Filter products based on search
  const filteredProducts = mockProducts.filter(product => 
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  
  // Filter invoices based on search
  const filteredInvoices = invoices.filter(invoice => 
    invoice.id.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    invoice.customer.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const addItemToInvoice = () => {
    if (!selectedProduct || !quantity) {
      toast.error('Please select a product and quantity');
      return;
    }

    const product = mockProducts.find(p => p.id === parseInt(selectedProduct));
    if (!product) return;

    const qty = parseInt(quantity);
    if (qty > product.stock) {
      toast.error('Insufficient stock available');
      return;
    }

    const existingItem = invoiceItems.find(item => item.productId === product.id);
    if (existingItem) {
      setInvoiceItems(prev => prev.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + qty, total: (item.quantity + qty) * item.price }
          : item
      ));
    } else {
      const newItem: InvoiceItem = {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        price: product.price,
        total: qty * product.price
      };
      setInvoiceItems(prev => [...prev, newItem]);
    }

    setSelectedProduct('');
    setQuantity('1');
  };

  const removeItemFromInvoice = (productId: number) => {
    setInvoiceItems(prev => prev.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((total, item) => total + item.total, 0);
  };

  const createOrUpdateInvoice = () => {
    if (!customerName || invoiceItems.length === 0) {
      toast.error('Please fill in customer details and add items');
      return;
    }

    if (editMode && editInvoiceId) {
      // Update existing invoice
      setInvoices(prev => prev.map(invoice => 
        invoice.id === editInvoiceId 
          ? {
              ...invoice,
              customer: customerName,
              amount: calculateTotal(),
              items: invoiceItems.length,
              status: invoiceStatus
            }
          : invoice
      ));
      toast.success('Invoice updated successfully');
    } else {
      // Create new invoice
      const newInvoice = {
        id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
        customer: customerName,
        date: new Date().toISOString().split('T')[0],
        amount: calculateTotal(),
        status: invoiceStatus,
        items: invoiceItems.length
      };
      setInvoices(prev => [newInvoice, ...prev]);
      toast.success('Invoice created successfully');
    }

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setInvoiceItems([]);
    setInvoiceStatus('Pending');
    setEditMode(false);
    setEditInvoiceId(null);
    setShowCreateForm(false);
  };

  const handleEditInvoice = (invoice: any) => {
    setCustomerName(invoice.customer);
    setInvoiceStatus(invoice.status);
    setEditInvoiceId(invoice.id);
    setEditMode(true);
    
    // For demo purposes, create dummy items based on the invoice amount
    const dummyItem: InvoiceItem = {
      productId: 999,
      productName: "Invoice Item",
      quantity: 1,
      price: invoice.amount,
      total: invoice.amount
    };
    setInvoiceItems([dummyItem]);
    
    setShowCreateForm(true);
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
  };

  const printInvoice = (invoice: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.id}</title>
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
            <p><strong>Invoice Number:</strong> ${invoice.id}</p>
            <p><strong>Date:</strong> ${invoice.date}</p>
            <p><strong>Status:</strong> <span class="status status-${invoice.status.toLowerCase()}">${invoice.status}</span></p>
          </div>
          
          <div class="customer-details">
            <h3>Bill To:</h3>
            <p><strong>${invoice.customer}</strong></p>
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
              <tr>
                <td colspan="3" style="text-align: right;"><strong>Total Items:</strong></td>
                <td>${invoice.items}</td>
              </tr>
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
        }}>
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
              {editMode ? `Edit Invoice ${editInvoiceId}` : 'Create New Invoice'}
            </CardTitle>
            <CardDescription>
              {editMode ? 'Update invoice details' : 'Generate an invoice for customer purchase'}
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
                />
              </div>
            </div>

            {/* Status Selection (only show in edit mode) */}
            {editMode && (
              <div className="space-y-2">
                <Label htmlFor="invoiceStatus">Invoice Status</Label>
                <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
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
            )}

            {/* Add Items */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Add Items</h3>
              
              {/* Product Search */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-4 mb-4">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map(product => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - LKR {product.price.toFixed(2)} (Stock: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Qty"
                  className="w-20"
                />
                <Button onClick={addItemToInvoice}>Add</Button>
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
              <Button onClick={createOrUpdateInvoice} disabled={!customerName || invoiceItems.length === 0}>
                {editMode ? 'Update Invoice' : 'Create Invoice'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
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
            />
          </div>
        </CardHeader>
        <CardContent>
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
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.items} items</TableCell>
                    <TableCell>LKR {invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewInvoice(invoice)} title="View Details">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditInvoice(invoice)} title="Edit Invoice">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => printInvoice(invoice)} title="Print Invoice">
                          <Printer className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
              Details for invoice {selectedInvoice?.id}
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
                      <span>{selectedInvoice.id}</span>
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
                      <span className="font-medium">Items:</span>
                      <span>{selectedInvoice.items}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-semibold">LKR {selectedInvoice.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Actions</h3>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => {
                    handleEditInvoice(selectedInvoice);
                    setShowViewDialog(false);
                  }} className="flex items-center">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Invoice
                  </Button>
                  <Button size="sm" onClick={() => printInvoice(selectedInvoice)} className="flex items-center">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}