import React, { useState, useRef } from 'react';
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

const mockProducts = [
  { id: 1, name: 'iPhone 14 Pro', barcode: '123456789012', price: 1299.99, stock: 25 },
  { id: 2, name: 'Samsung Galaxy S23', barcode: '123456789013', price: 1099.99, stock: 15 },
  { id: 3, name: 'MacBook Pro 14"', barcode: '123456789014', price: 2099.99, stock: 8 },
  { id: 4, name: 'iPad Air', barcode: '123456789015', price: 649.99, stock: 12 },
  { id: 5, name: 'AirPods Pro', barcode: '123456789016', price: 249.99, stock: 30 },
  { id: 6, name: 'Apple Watch', barcode: '123456789017', price: 399.99, stock: 20 }
];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export function BillPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  );

  const addToCart = (product: typeof mockProducts[0]) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(prev => prev.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      };
      setCart(prev => [...prev, newItem]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (id: number, change: number) => {
    const product = mockProducts.find(p => p.id === id);
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
        return { ...item, quantity: newQuantity, total: newQuantity * item.price };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getSubtotal = () => cart.reduce((sum, item) => sum + item.total, 0);
  const getDiscountAmount = () => (getSubtotal() * discount) / 100;
  const getTotalAfterDiscount = () => getSubtotal() - getDiscountAmount();
  const getTax = () => getTotalAfterDiscount() * 0.1; // 10% tax
  const getFinalTotal = () => getTotalAfterDiscount() + getTax();
  const getChange = () => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - getFinalTotal());
  };

  const handleCheckout = () => {
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

    // Generate invoice
    const invoiceData = {
      id: `INV-${Date.now()}`,
      customer: customerName || 'Walk-in Customer',
      phone: customerPhone,
      items: cart,
      subtotal: getSubtotal(),
      discount: getDiscountAmount(),
      tax: getTax(),
      total: getFinalTotal(),
      paymentMethod,
      amountReceived: parseFloat(amountReceived) || getFinalTotal(),
      change: getChange(),
      date: new Date().toLocaleString()
    };

    setLastInvoice(invoiceData);
    setShowBillDialog(true);

    // Clear the form
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setAmountReceived('');
    setDiscount(0);
    setSearchTerm('');

    toast.success('Payment processed successfully!');
    // console.log('Invoice:', invoiceData); // In real app, save to database
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
			  <div class="brand">Inventory Management</div>
			  <div style="font-size:13px;font-weight:600;margin-top:4px;">INVOICE</div>
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
			  <div class="summary-row"><span class="small-muted">Tax (10%)</span><span>LKR ${lastInvoice.tax.toFixed(2)}</span></div>
			  <div class="summary-row total"><span>Total</span><span>LKR ${lastInvoice.total.toFixed(2)}</span></div>
			  <div class="summary-row small-muted"><span>Received</span><span>LKR ${lastInvoice.amountReceived.toFixed(2)}</span></div>
			  <div class="summary-row small-muted"><span>Change</span><span>LKR ${lastInvoice.change.toFixed(2)}</span></div>
			</div>

			<div class="footer">
			  Thank you for your purchase<br/>Powered by Inventory Management System
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
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Product Selection Panel */}
        <div className="flex-1 space-y-4">
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
                  placeholder="Search products by name or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <Card 
                      key={product.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">{product.name}</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Price: LKR {product.price.toFixed(2)}</p>
                          <p>Stock: {product.stock} units</p>
                          <p className="text-xs">Barcode: {product.barcode}</p>
                        </div>
                        <Button size="sm" className="w-full mt-3">
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart and Checkout Panel */}
        <div className="w-full lg:w-96 space-y-4">
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
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cart ({cart.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Cart is empty</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">LKR {item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
              <CardTitle className="text-base">Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>LKR {getSubtotal().toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span>Discount:</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-16 h-6 text-xs"
                  />
                  <span>%</span>
                  <span className="ml-auto">-LKR {getDiscountAmount().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>LKR {getTax().toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>LKR {getFinalTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('cash')}
                    className="flex-1"
                  >
                    Cash
                  </Button>
                  <Button
                    size="sm"
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('card')}
                    className="flex-1"
                  >
                    Card
                  </Button>
                </div>
              </div>

              {/* Cash Payment */}
              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <Label>Amount Received</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="Enter amount received"
                  />
                  {amountReceived && (
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Change:</span>
                        <span className="font-medium">LKR {getChange().toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Bill Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl shadow-lg">
          <div className="bg-gradient-to-r from-primary to-primary/70 text-white px-6 py-4">
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
                      <tr key={item.id} className="border-b last:border-b-0">
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
                  <span className="text-muted-foreground">Tax (10%)</span>
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

              <div className="mt-6 text-center text-xs text-muted-foreground">
                Thank you for your purchase!<br/>Powered by Inventory Management System
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