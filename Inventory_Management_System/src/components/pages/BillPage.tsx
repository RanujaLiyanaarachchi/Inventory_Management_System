import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { CreditCard, Plus, Minus, Trash2, Calculator, Printer, Receipt } from 'lucide-react';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { collection, addDoc, updateDoc, doc, arrayUnion, increment, getDocs, query, where, writeBatch, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { companyConfig, formatFooter, formatDialogFooter } from '../../config/companyConfig';

// Firebase product interface (same as your Products page)
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  stock: number; // Add stock to cart item for validation
}

export function BillPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountInput, setDiscountInput] = useState('0'); // Add separate input state for better UX
  const [taxRate, setTaxRate] = useState(0); // Add editable tax rate state
  const [taxRateInput, setTaxRateInput] = useState('0'); // Add separate input state for better UX
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch products from Firebase in real-time
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsCollectionRef = collection(db, 'products');
        const q = query(productsCollectionRef, orderBy('name', 'asc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const productsData: Product[] = [];
          querySnapshot.forEach((doc) => {
            productsData.push({ id: doc.id, ...doc.data() } as Product);
          });
          
          // Filter only active products
          const activeProducts = productsData.filter(product => product.status === 'Active');
          setProducts(activeProducts);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Error loading products');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(prev => prev.map(item =>
        item.id === product.id
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              total: (item.quantity + 1) * item.price,
              stock: product.stock // Update stock reference
            }
          : item
      ));
      toast.success(`${product.name} quantity updated`);
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.sellingPrice, // Use selling price from Firebase
        quantity: 1,
        total: product.sellingPrice,
        stock: product.stock
      };
      setCart(prev => [...prev, newItem]);
      toast.success(`${product.name} added to cart`);
    }
  };

  const updateQuantity = (id: string, change: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity > product.stock) {
          toast.error('Insufficient stock');
          return item;
        }
        if (newQuantity === 0) {
          return null as any;
        }
        return { 
          ...item, 
          quantity: newQuantity, 
          total: newQuantity * item.price,
          stock: product.stock // Update stock reference
        };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getSubtotal = () => cart.reduce((sum, item) => sum + item.total, 0);
  const getDiscountAmount = () => (getSubtotal() * discount) / 100;
  const getTotalAfterDiscount = () => getSubtotal() - getDiscountAmount();
  const getTax = () => getTotalAfterDiscount() * (taxRate / 100); // Use editable tax rate

  // Handle discount input changes
  const handleDiscountChange = (value: string) => {
    setDiscountInput(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
      setDiscount(numericValue);
    } else if (value === '') {
      setDiscount(0);
    }
  };

  // Handle tax rate input changes
  const handleTaxRateChange = (value: string) => {
    setTaxRateInput(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
      setTaxRate(numericValue);
    } else if (value === '') {
      setTaxRate(0);
    }
  };
  const getFinalTotal = () => getTotalAfterDiscount() + getTax();
  const getChange = () => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - getFinalTotal());
  };

  // Function to generate a sequential invoice number
  const generateInvoiceNumber = async (): Promise<string> => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      
      // Get the last invoice for this month to continue numbering
      const invoicesRef = collection(db, 'invoices');
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const q = query(
        invoicesRef, 
        where('createdAt', '>=', startOfMonth),
        where('createdAt', '<=', today)
      );
      
      const querySnapshot = await getDocs(q);
      const invoiceCount = querySnapshot.size + 1;
      
      return `INV-${year}${month}-${String(invoiceCount).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based ID
      return `INV-${Date.now()}`;
    }
  };

  // Function to update product stock in Firebase after sale
  const updateProductStock = async (cartItems: CartItem[]) => {
    try {
      const batch = writeBatch(db);
      
      for (const item of cartItems) {
        const productDocRef = doc(db, 'products', item.id);
        batch.update(productDocRef, {
          stock: increment(-item.quantity),
          updatedAt: new Date()
        });
      }
      
      await batch.commit();
      console.log('Product stock updated successfully');
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived) || 0;
      if (received < getFinalTotal()) {
        toast.error('Insufficient payment amount');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();
      
      // Generate invoice data
      const invoiceData = {
        id: invoiceNumber,
        invoiceNumber: invoiceNumber,
        customer: customerName || 'Walk-in Customer',
        phone: customerPhone || '',
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.total
        })),
        subtotal: getSubtotal(),
        discount: getDiscountAmount(),
        discountPercentage: discount,
        tax: getTax(),
        taxRate: taxRate, // Use editable tax rate
        total: getFinalTotal(),
        paymentMethod,
        amountReceived: paymentMethod === 'cash' ? parseFloat(amountReceived) || getFinalTotal() : getFinalTotal(),
        change: getChange(),
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save invoice to Firestore
      const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
      
      // Update product stock in Firebase
      await updateProductStock(cart);

      // Set last invoice for display
      setLastInvoice({
        ...invoiceData,
        firebaseId: docRef.id,
        date: new Date().toLocaleString()
      });

      setShowBillDialog(true);

      // Clear the form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setAmountReceived('');
      setDiscount(0);
      setDiscountInput('0'); // Reset discount input to default
      setTaxRate(0); // Reset tax rate to default
      setTaxRateInput('0'); // Reset tax rate input to default
      setSearchTerm('');

      toast.success('Payment processed successfully! Invoice saved to database.');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintBill = () => {
    if (!lastInvoice) return;

    // build rows HTML from items
    const itemsHtml = lastInvoice.items.map((item: any) => `
      <tr>
        <td class="item-name">${item.name}</td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-unit">${item.price.toFixed(2)}</td>
        <td class="item-total">${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice ${lastInvoice.id}</title>
      <style>
        :root{
          --width: 80mm;
          --muted:#6b7280;
          --accent:#0ea5a3;
        }
        @media print {
          @page { margin: 0; size: auto; }
          body { margin: 0; }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          background: #fff;
          padding: 8px;
          color: #111827;
        }
        .receipt {
          width: var(--width);
          max-width: 320px;
          margin: 0 auto;
          padding: 8px 12px;
        }
        .header { text-align: center; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
        .brand { font-size: 18px; font-weight: 700; letter-spacing: 0.6px; color: var(--accent); }
        .meta { font-size: 11px; color: var(--muted); margin-top: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th, td { padding: 6px 4px; }
        thead th { text-align: left; font-size: 12px; color: #374151; }
        tbody tr { border-bottom: 1px dashed #e5e7eb; }
        .item-name { width: 50%; }
        .item-qty { width: 12%; text-align: center; }
        .item-unit, .item-total { width: 19%; text-align: right; }
        .summary { margin-top: 8px; font-size: 13px; }
        .summary-row { display:flex; justify-content:space-between; padding:4px 0; }
        .total { font-weight:700; font-size: 15px; color: #111827; }
        .small-muted { font-size: 11px; color: var(--muted); }
        .footer { text-align:center; margin-top:10px; font-size:11px; color:var(--muted); }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="brand">${companyConfig.name}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">${companyConfig.address}</div>
          <div style="font-size:11px;color:#6b7280;">${companyConfig.city}</div>
          <div style="font-size:11px;color:#6b7280;">Phone: ${companyConfig.phone}</div>
          <div style="font-size:11px;color:#6b7280;">Email: ${companyConfig.email}</div>
          <div style="font-size:13px;font-weight:600;margin-top:8px;">INVOICE</div>
          <div class="meta">
            <div>Invoice: <strong>${lastInvoice.id}</strong></div>
            <div>Date: ${lastInvoice.date}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;">
          <div>
            <div class="small-muted">Customer</div>
            <div>${(lastInvoice.customer || 'Walk-in Customer')}</div>
            <div class="small-muted">${lastInvoice.phone || ''}</div>
          </div>
          <div style="text-align:right;">
            <div class="small-muted">Payment</div>
            <div style="text-transform:capitalize">${lastInvoice.paymentMethod}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="item-qty">Qty</th>
              <th class="item-unit">Unit</th>
              <th class="item-total">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row"><span class="small-muted">Subtotal</span><span>LKR ${lastInvoice.subtotal.toFixed(2)}</span></div>
          <div class="summary-row"><span class="small-muted">Discount</span><span>-LKR ${lastInvoice.discount.toFixed(2)}</span></div>
          <div class="summary-row"><span class="small-muted">Tax (${lastInvoice.taxRate}%)</span><span>LKR ${lastInvoice.tax.toFixed(2)}</span></div>
          <div class="summary-row total"><span>Total</span><span>LKR ${lastInvoice.total.toFixed(2)}</span></div>
          <div class="summary-row small-muted"><span>Received</span><span>LKR ${lastInvoice.amountReceived.toFixed(2)}</span></div>
          <div class="summary-row small-muted"><span>Change</span><span>LKR ${lastInvoice.change.toFixed(2)}</span></div>
        </div>

        <div class="footer">
          <p>${companyConfig.footerMessage || 'Thank you for your purchase'}</p>
          <div style="margin-top: 8px; font-size: 10px; color: #9ca3af;">
            Software by ${companyConfig.softwareProvider.name}<br/>
            ${companyConfig.softwareProvider.phone}
            ${companyConfig.softwareProvider.email ? `<br/>${companyConfig.softwareProvider.email}` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=800');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();

    // wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  return (
    <>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-sm text-gray-600">Process sales and manage transactions</p>
        </div>
        
        {/* Main Content - Side by Side Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Product Selection (Smaller) */}
          <div className="flex-1 p-4 overflow-y-auto" style={{maxWidth: '50%'}}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Product Selection
              </CardTitle>
              <CardDescription>Search and select products to add to cart</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search products by name, SKU, or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading products...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 gap-2 max-h-[450px] overflow-y-auto">
                    {filteredProducts.map(product => (
                      <Card 
                        key={product.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-2">
                          <h4 className="font-medium text-xs mb-1 line-clamp-1">{product.name}</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-primary">LKR {product.sellingPrice.toFixed(2)}</span>
                              <span className={`text-xs px-1 py-0.5 rounded text-center min-w-[20px] ${product.stock <= product.minStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {product.stock}
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-1 h-6 text-xs"
                            disabled={product.stock === 0}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {product.stock === 0 ? 'Out' : 'Add'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {!loading && filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {products.length === 0 ? 'No products found. Add products in the Products page first.' : 'No products found matching your search.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Right Panel - Cart and Bill Summary (Larger) */}
          <div className="flex-1 bg-gray-50 border-l flex flex-col" style={{minWidth: '50%'}}>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                placeholder="Phone number (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </CardContent>
          </Card>

            {/* Cart */}
            <Card className={cart.length > 0 ? 'ring-2 ring-primary/20 shadow-lg' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Shopping Cart ({cart.length})
                  {cart.length > 0 && (
                    <Badge variant="default" className="ml-auto">
                      {cart.length} {cart.length === 1 ? 'item' : 'items'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Cart is empty</p>
                      <p className="text-xs mt-1">Add products to get started</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-base truncate">{item.name}</p>
                            <p className="text-sm text-muted-foreground">LKR {item.price.toFixed(2)} each</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-8 w-8"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.quantity >= item.stock}
                              className="h-8 w-8"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold">LKR {item.total.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">LKR {getSubtotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="text-red-600 font-medium">-LKR {getDiscountAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={discountInput}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        className="w-16 h-8 text-xs"
                        placeholder="0"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">LKR {getTax().toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={taxRateInput}
                        onChange={(e) => handleTaxRateChange(e.target.value)}
                        className="w-16 h-8 text-xs"
                        placeholder="0"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center py-2 bg-primary/5 rounded-lg px-3">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-xl font-bold text-primary">LKR {getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('cash')}
                      className="h-10"
                    >
                      💵 Cash
                    </Button>
                    <Button
                      size="sm"
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className="h-10"
                    >
                      💳 Card
                    </Button>
                  </div>
                </div>

                {/* Cash Payment */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Amount Received</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder="Enter amount received"
                        className="h-10"
                      />
                    </div>
                    {amountReceived && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-blue-900">Change Due:</span>
                          <span className="text-lg font-bold text-blue-900">LKR {getChange().toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  className="w-full h-12 text-base font-semibold" 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isProcessing}
                >
                  <Receipt className="h-5 w-5 mr-2" />
                  {isProcessing ? 'Processing...' : 'Process Payment'}
                </Button>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
      {/* Bill Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl shadow-lg">
          <div className="bg-gradient-to-r from-primary to-primary/70 text-white px-6 py-4">
            <div className="text-center mb-3">
              <div className="text-lg font-semibold">{companyConfig.name}</div>
              <div className="text-xs opacity-90">{companyConfig.address}</div>
              <div className="text-xs opacity-90">{companyConfig.city}</div>
              <div className="text-xs opacity-90">Phone: {companyConfig.phone}</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">INVOICE</div>
                <div className="text-sm opacity-90">Receipt</div>
              </div>
              <div className="text-right text-xs">
                <div className="font-mono">{lastInvoice?.id}</div>
                <div className="opacity-90">{lastInvoice?.date}</div>
              </div>
            </div>
          </div>

          {lastInvoice && (
            <div ref={printRef} className="bg-white p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">Customer</div>
                  <div className="font-medium">{lastInvoice.customer}</div>
                  <div className="text-xs text-muted-foreground">{lastInvoice.phone || '-'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Payment</div>
                  <div className="font-medium capitalize">{lastInvoice.paymentMethod}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="text-left pb-2">Product</th>
                      <th className="text-center pb-2">Qty</th>
                      <th className="text-right pb-2">Unit (LKR)</th>
                      <th className="text-right pb-2">Total (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastInvoice.items.map((item: any) => (
                      <tr key={item.productId} className="border-b last:border-b-0">
                        <td className="py-2">{item.name}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">{item.price.toFixed(2)}</td>
                        <td className="py-2 text-right font-medium">{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">LKR {lastInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">-LKR {lastInvoice.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({lastInvoice.taxRate}%)</span>
                  <span className="font-medium">LKR {lastInvoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-semibold text-primary">LKR {lastInvoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-2">
                  <span>Received</span>
                  <span>LKR {lastInvoice.amountReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Change</span>
                  <span>LKR {lastInvoice.change.toFixed(2)}</span>
                </div>
              </div>

            </div>
          )}

          <DialogFooter className="flex gap-2 p-4">
            <Button onClick={handlePrintBill} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={() => setShowBillDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}