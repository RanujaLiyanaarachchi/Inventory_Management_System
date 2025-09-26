import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Users, Truck, TrendingUp, AlertTriangle, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from "sonner";
import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

// Interfaces matching your existing data structures
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

interface Invoice {
  id: string;
  invoiceId: string;
  customer: string;
  customerEmail: string;
  date: string;
  amount: number;
  status: string;
  items: any[];
  totalItems: number;
  paymentMethod?: string;
  amountReceived?: number;
  change?: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  status: 'Active' | 'Inactive';
  createdDate: string;
}

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Dashboard metrics state
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    activeSuppliers: 0,
    monthlyRevenue: 0,
    lowStockAlerts: 0,
    totalSales: 0,
    totalOrders: 0,
    growthRate: 0
  });

  const [salesData, setSalesData] = useState<{ name: string; sales: number; orders: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [lowStockItems, setLowStockItems] = useState<{ name: string; stock: number; minimum: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<{ type: string; message: string; timestamp: string }[]>([]);

  // Color palette for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ff8042', '#00C49F'];

  // Fetch all data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products
        const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
          const productsData: Product[] = [];
          snapshot.forEach((doc) => {
            productsData.push({ id: doc.id, ...doc.data() } as Product);
          });
          setProducts(productsData);
        });

        // Fetch suppliers
        const suppliersQuery = query(collection(db, 'suppliers'), orderBy('createdAt', 'desc'));
        const unsubscribeSuppliers = onSnapshot(suppliersQuery, (snapshot) => {
          const suppliersData: Supplier[] = [];
          snapshot.forEach((doc) => {
            suppliersData.push({ ...doc.data() } as Supplier);
          });
          setSuppliers(suppliersData);
        });

        // Fetch invoices (last 30 days for monthly revenue calculation)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('date', '>=', thirtyDaysAgo.toISOString().split('T')[0]),
          orderBy('date', 'desc')
        );
        
        const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
          const invoicesData: Invoice[] = [];
          snapshot.forEach((doc) => {
            invoicesData.push({ id: doc.id, ...doc.data() } as Invoice);
          });
          setInvoices(invoicesData);
        });

        // Fetch categories
        const categoriesQuery = query(collection(db, 'categories'));
        const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
          const categoriesData: Category[] = [];
          snapshot.forEach((doc) => {
            categoriesData.push({ id: doc.id, ...doc.data() } as Category);
          });
          setCategories(categoriesData);
        });

        // Set loading to false after initial data load
        setTimeout(() => setLoading(false), 1000);

        return () => {
          unsubscribeProducts();
          unsubscribeSuppliers();
          unsubscribeInvoices();
          unsubscribeCategories();
        };
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate metrics when data changes
  useEffect(() => {
    if (products.length > 0 || suppliers.length > 0 || invoices.length > 0) {
      calculateMetrics();
      setLastUpdated(new Date());
    }
  }, [products, suppliers, invoices, categories]);

  const calculateMetrics = () => {
    // Calculate basic metrics
    const totalProducts = products.length;
    const activeSuppliers = suppliers.filter(supplier => supplier.status === 'Active').length;
    
    // Calculate monthly revenue (last 30 days)
    const currentMonth = new Date();
    const monthlyRevenue = invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        const diffTime = Math.abs(currentMonth.getTime() - invoiceDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && invoice.status === 'Paid';
      })
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    // Calculate low stock alerts
    const lowStockAlerts = products.filter(product => product.stock <= product.minStock).length;

    // Calculate total sales and orders
    const totalSales = invoices
      .filter(invoice => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    
    const totalOrders = invoices.length;

    // Calculate growth rate (compared to previous month)
    const currentMonthInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate.getMonth() === new Date().getMonth() && 
             invoiceDate.getFullYear() === new Date().getFullYear() &&
             invoice.status === 'Paid';
    });
    
    const previousMonthInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      const prevMonth = new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1;
      const prevYear = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
      return invoiceDate.getMonth() === prevMonth && 
             invoiceDate.getFullYear() === prevYear &&
             invoice.status === 'Paid';
    });

    const currentMonthRevenue = currentMonthInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const previousMonthRevenue = previousMonthInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    
    const growthRate = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : currentMonthRevenue > 0 ? 100 : 0;

    setMetrics({
      totalProducts,
      activeSuppliers,
      monthlyRevenue,
      lowStockAlerts,
      totalSales,
      totalOrders,
      growthRate: Math.round(growthRate * 100) / 100
    });

    // Prepare sales data for chart (last 6 months)
    prepareSalesData();
    
    // Prepare category data for pie chart
    prepareCategoryData();
    
    // Prepare low stock items
    prepareLowStockItems();
    
    // Prepare recent activities
    prepareRecentActivities();
  };

  const prepareSalesData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    const salesData = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      
      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate.getMonth() === monthIndex && 
               invoiceDate.getFullYear() === new Date().getFullYear() &&
               invoice.status === 'Paid';
      });
      
      const monthlySales = monthInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      const monthlyOrders = monthInvoices.length;
      
      salesData.push({
        name: monthName,
        sales: monthlySales,
        orders: monthlyOrders
      });
    }
    
    setSalesData(salesData);
  };

  const prepareCategoryData = () => {
    const categorySales: { [key: string]: number } = {};
    
    // Calculate sales by category
    invoices.forEach(invoice => {
      if (invoice.status === 'Paid') {
        invoice.items.forEach((item: any) => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            if (!categorySales[product.category]) {
              categorySales[product.category] = 0;
            }
            categorySales[product.category] += item.total || item.quantity * item.price;
          }
        });
      }
    });
    
    // Convert to array format for pie chart
    const categoryData = Object.entries(categorySales).map(([name, value], index) => ({
      name,
      value: Math.round(value),
      color: COLORS[index % COLORS.length]
    }));
    
    // If no sales data, show product count by category
    if (categoryData.length === 0) {
      const productCountByCategory: { [key: string]: number } = {};
      products.forEach(product => {
        if (!productCountByCategory[product.category]) {
          productCountByCategory[product.category] = 0;
        }
        productCountByCategory[product.category]++;
      });
      
      setCategoryData(
        Object.entries(productCountByCategory).map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length]
        }))
      );
    } else {
      setCategoryData(categoryData);
    }
  };

  const prepareLowStockItems = () => {
    const lowStock = products
      .filter(product => product.stock <= product.minStock)
      .slice(0, 4) // Show only top 4
      .map(product => ({
        name: product.name,
        stock: product.stock,
        minimum: product.minStock
      }));
    
    setLowStockItems(lowStock);
  };

  const prepareRecentActivities = () => {
    const activities = [];
    
    // Recent product additions
    const recentProducts = products
      .sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt).getTime() - new Date(a.createdAt?.toDate?.() || a.createdAt).getTime())
      .slice(0, 2);
    
    recentProducts.forEach(product => {
      activities.push({
        type: 'product',
        message: `New product "${product.name}" added`,
        timestamp: formatTimeAgo(product.createdAt?.toDate?.() || product.createdAt)
      });
    });
    
    // Recent invoices
    const recentInvoices = invoices.slice(0, 2);
    recentInvoices.forEach(invoice => {
      activities.push({
        type: 'sale',
        message: `New sale to ${invoice.customer} - LKR ${invoice.amount}`,
        timestamp: formatTimeAgo(invoice.createdAt)
      });
    });
    
    // Low stock alerts
    if (metrics.lowStockAlerts > 0) {
      activities.push({
        type: 'alert',
        message: `${metrics.lowStockAlerts} low stock alert${metrics.lowStockAlerts > 1 ? 's' : ''} need attention`,
        timestamp: 'Just now'
      });
    }
    
    setRecentActivities(activities.slice(0, 4)); // Show only 4 most recent
  };

  const formatTimeAgo = (date: any) => {
    if (!date) return 'Recently';
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString();
  };

  const refreshData = () => {
    setLoading(true);
    calculateMetrics();
    setTimeout(() => {
      setLoading(false);
      toast.success('Dashboard data refreshed');
    }, 500);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Real-time business overview</p>
          </div>
          <Button variant="outline" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time business overview • Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button 
          onClick={refreshData}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {categories.length} categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {suppliers.length} total suppliers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {metrics.monthlyRevenue.toLocaleString()}</div>
            <p className={`text-xs ${metrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.growthRate >= 0 ? '+' : ''}{metrics.growthRate}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Last 6 months revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`LKR ${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="sales" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {categoryData.some(item => item.value > 1000) ? 'Sales by Category' : 'Products by Category'}
            </CardTitle>
            <CardDescription>
              {categoryData.some(item => item.value > 1000) ? 'Revenue distribution' : 'Product distribution'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    categoryData.some(item => item.value > 1000) 
                      ? `LKR ${value.toLocaleString()}` 
                      : `${value} products`,
                    categoryData.some(item => item.value > 1000) ? 'Revenue' : 'Count'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Minimum: {item.minimum} units
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.stock === 0 ? "destructive" : item.stock <= item.minimum / 2 ? "destructive" : "secondary"}>
                        {item.stock} left
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No low stock items</p>
                  <p className="text-sm">All products are well stocked</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.type === 'product' ? 'bg-green-500' :
                      activity.type === 'sale' ? 'bg-blue-500' :
                      activity.type === 'alert' ? 'bg-yellow-500' : 'bg-purple-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activities</p>
                  <p className="text-sm">Activities will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}