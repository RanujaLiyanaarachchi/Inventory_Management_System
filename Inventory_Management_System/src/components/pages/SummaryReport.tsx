import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  FileText, 
  Package, 
  DollarSign, 
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from "sonner";

// Firebase imports
import { db } from '../../firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where,
  onSnapshot
} from 'firebase/firestore';

// Interfaces
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

interface Invoice {
  id: string;
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

interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  status: 'Active' | 'Inactive';
  createdDate: string;
}

interface Supplier {
  supplierId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: 'Active' | 'Inactive';
  contactPerson: string;
  paymentTerms: string;
  creditLimit: number;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function SummaryReport() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Real-time data for report
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
    totalCustomers: 0,
    activeSuppliers: 0,
    monthlyGrowth: 0,
    topSellingProducts: [] as { name: string; sales: number; revenue: number }[],
    salesByCategory: [] as { category: string; sales: number; percentage: number }[]
  });

  // Fetch products from Firebase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsQuery = query(collection(db, 'products'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(productsQuery, 
          (querySnapshot) => {
            const productsData: Product[] = [];
            querySnapshot.forEach((doc) => {
              productsData.push({ id: doc.id, ...doc.data() } as Product);
            });
            setProducts(productsData);
          },
          (error) => {
            console.error('Error fetching products:', error);
            toast.error('Error fetching products');
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  // Fetch invoices from Firebase
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoicesQuery = query(collection(db, 'invoices'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(invoicesQuery, 
          (querySnapshot) => {
            const invoicesData: Invoice[] = [];
            querySnapshot.forEach((doc) => {
              invoicesData.push({ id: doc.id, ...doc.data() } as Invoice);
            });
            setInvoices(invoicesData);
          },
          (error) => {
            console.error('Error fetching invoices:', error);
            toast.error('Error fetching invoices');
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };

    fetchInvoices();
  }, []);

  // Fetch categories from Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(categoriesQuery, 
          (querySnapshot) => {
            const categoriesData: Category[] = [];
            querySnapshot.forEach((doc) => {
              categoriesData.push({ id: doc.id, ...doc.data() } as Category);
            });
            setCategories(categoriesData);
          },
          (error) => {
            console.error('Error fetching categories:', error);
            toast.error('Error fetching categories');
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch suppliers from Firebase
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const suppliersQuery = query(collection(db, 'suppliers'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(suppliersQuery, 
          (querySnapshot) => {
            const suppliersData: Supplier[] = [];
            querySnapshot.forEach((doc) => {
              suppliersData.push({ ...doc.data() } as Supplier);
            });
            setSuppliers(suppliersData);
          },
          (error) => {
            console.error('Error fetching suppliers:', error);
            toast.error('Error fetching suppliers');
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };

    fetchSuppliers();
  }, []);

  // Calculate report data when data changes
  useEffect(() => {
    if (products.length > 0 || invoices.length > 0 || categories.length > 0 || suppliers.length > 0) {
      calculateReportData();
      setLoading(false);
    }
  }, [products, invoices, categories, suppliers]);

  const calculateReportData = () => {
    // Calculate total sales from paid invoices
    const totalSales = invoices
      .filter(invoice => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    // Calculate total orders
    const totalOrders = invoices.length;

    // Calculate total products
    const totalProducts = products.length;

    // Calculate low stock items (stock <= minStock)
    const lowStockItems = products.filter(product => product.stock <= product.minStock).length;

    // Get unique customers from invoices
    const uniqueCustomers = new Set(invoices.map(invoice => invoice.customer));
    const totalCustomers = uniqueCustomers.size;

    // Count active suppliers
    const activeSuppliers = suppliers.filter(supplier => supplier.status === 'Active').length;

    // Calculate monthly growth (simplified - compare current month with previous month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
    });
    
    const previousMonthInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return invoiceDate.getMonth() === prevMonth && invoiceDate.getFullYear() === prevYear;
    });

    const currentMonthSales = currentMonthInvoices
      .filter(invoice => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const previousMonthSales = previousMonthInvoices
      .filter(invoice => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const monthlyGrowth = previousMonthSales > 0 
      ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100 
      : currentMonthSales > 0 ? 100 : 0;

    // Calculate top selling products
    const productSales: { [key: string]: { name: string; sales: number; revenue: number } } = {};

    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            sales: 0,
            revenue: 0
          };
        }
        productSales[item.productId].sales += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    // Calculate sales by category
    const categorySales: { [key: string]: number } = {};

    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const category = product.category;
          if (!categorySales[category]) {
            categorySales[category] = 0;
          }
          categorySales[category] += item.total;
        }
      });
    });

    const totalCategorySales = Object.values(categorySales).reduce((sum, sales) => sum + sales, 0);
    const salesByCategory = Object.entries(categorySales).map(([category, sales]) => ({
      category,
      sales,
      percentage: totalCategorySales > 0 ? (sales / totalCategorySales) * 100 : 0
    })).sort((a, b) => b.sales - a.sales);

    setReportData({
      totalSales,
      totalOrders,
      totalProducts,
      lowStockItems,
      totalCustomers,
      activeSuppliers,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100, // Round to 2 decimal places
      topSellingProducts,
      salesByCategory
    });
  };

  const refreshData = () => {
    setLoading(true);
    calculateReportData();
    setTimeout(() => setLoading(false), 500);
    toast.success('Report data refreshed');
  };

  const exportToPDF = () => {
    toast.loading('Generating PDF...');
    
    setTimeout(() => {
      const reportWindow = window.open('', '_blank');
      if (!reportWindow) {
        toast.dismiss();
        toast.error('Please allow pop-ups to export the report');
        return;
      }

      const reportDate = new Date().toLocaleDateString();
      
      const reportContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Summary Report - ${reportDate}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 10px;
                border-bottom: 1px solid #ddd;
              }
              .date {
                font-size: 14px;
                color: #666;
                margin-top: 5px;
              }
              .metrics {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-bottom: 30px;
              }
              .metric {
                flex: 1;
                min-width: 200px;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
              }
              .metric-title {
                font-size: 14px;
                color: #666;
                margin-bottom: 5px;
              }
              .metric-value {
                font-size: 24px;
                font-weight: bold;
              }
              .metric-trend {
                font-size: 12px;
                color: #4CAF50;
              }
              .table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              .table th, .table td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
              }
              .table th {
                background-color: #f8f8f8;
              }
              .table tbody tr:nth-child(even) {
                background-color: #f8f8f8;
              }
              .section-title {
                margin-top: 30px;
                margin-bottom: 15px;
                font-size: 18px;
              }
              .bar-chart {
                margin-bottom: 30px;
              }
              .bar-item {
                margin-bottom: 15px;
              }
              .bar-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
              }
              .bar-container {
                height: 20px;
                background-color: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
              }
              .bar {
                height: 100%;
                background-color: #4CAF50;
              }
              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Business Summary Report</h1>
              <div class="date">Generated on ${reportDate}</div>
            </div>
            
            <div class="metrics">
              <div class="metric">
                <div class="metric-title">Total Sales</div>
                <div class="metric-value">LKR ${reportData.totalSales.toLocaleString()}</div>
                <div class="metric-trend">+${reportData.monthlyGrowth}% from last month</div>
              </div>
              
              <div class="metric">
                <div class="metric-title">Total Orders</div>
                <div class="metric-value">${reportData.totalOrders}</div>
                <div class="metric-trend">All time</div>
              </div>
              
              <div class="metric">
                <div class="metric-title">Total Products</div>
                <div class="metric-value">${reportData.totalProducts}</div>
                <div class="metric-trend">In inventory</div>
              </div>
              
              <div class="metric">
                <div class="metric-title">Low Stock Items</div>
                <div class="metric-value" style="color: #f44336;">${reportData.lowStockItems}</div>
                <div class="metric-trend">Need attention</div>
              </div>
            </div>
            
            <h2 class="section-title">Top Selling Products</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.topSellingProducts.map(product => `
                  <tr>
                    <td>${product.name}</td>
                    <td>${product.sales}</td>
                    <td>LKR ${product.revenue.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <h2 class="section-title">Sales by Category</h2>
            <div class="bar-chart">
              ${reportData.salesByCategory.map(category => `
                <div class="bar-item">
                  <div class="bar-header">
                    <span>${category.category}</span>
                    <span>LKR ${category.sales.toLocaleString()}</span>
                  </div>
                  <div class="bar-container">
                    <div class="bar" style="width: ${category.percentage}%;"></div>
                  </div>
                  <div style="font-size: 12px; color: #666;">
                    ${Math.round(category.percentage)}% of total sales
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Inventory Management System</p>
              <p>This is a system-generated report</p>
            </div>
          </body>
        </html>
      `;
      
      reportWindow.document.write(reportContent);
      reportWindow.document.close();
      
      toast.dismiss();
      toast.success('Report exported successfully');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Summary Report</h1>
            <p className="text-muted-foreground">Comprehensive business overview and analytics</p>
          </div>
          <Button variant="outline" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Summary Report</h1>
          <p className="text-muted-foreground">Comprehensive business overview and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {reportData.totalSales.toLocaleString()}</div>
            <p className={`text-xs ${reportData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {reportData.monthlyGrowth >= 0 ? '+' : ''}{reportData.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{reportData.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing items</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.topSellingProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.topSellingProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sales}</TableCell>
                      <TableCell>LKR {product.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No sales data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.salesByCategory.length > 0 ? (
              <div className="space-y-4">
                {reportData.salesByCategory.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{category.category}</span>
                      <span>LKR {category.sales.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(category.percentage)}% of total sales
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No category sales data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Overview</CardTitle>
            <CardDescription>Customer statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Customers</span>
                <span className="text-2xl font-bold">{reportData.totalCustomers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Suppliers</span>
                <span className="text-2xl font-bold">{reportData.activeSuppliers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Health</CardTitle>
            <CardDescription>Stock level overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Products in Stock</span>
                <span className="text-2xl font-bold text-green-600">
                  {products.filter(p => p.stock > 0).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Out of Stock</span>
                <span className="text-2xl font-bold text-red-600">
                  {products.filter(p => p.stock === 0).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}