import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  FileText, 
  Package, 
  DollarSign, 
  Download 
} from 'lucide-react';
import { toast } from "sonner";

export function SummaryReport() {
  const reportData = {
    totalSales: 125430.50,
    totalOrders: 347,
    totalProducts: 1250,
    lowStockItems: 23,
    totalCustomers: 89,
    activeSuppliers: 12,
    monthlyGrowth: 15.3,
    topSellingProducts: [
      { name: 'iPhone 14 Pro', sales: 45, revenue: 58455 },
      { name: 'Samsung Galaxy S23', sales: 32, revenue: 35168 },
      { name: 'MacBook Pro 14"', sales: 18, revenue: 37798 }
    ],
    salesByCategory: [
      { category: 'Electronics', sales: 85400, percentage: 68 },
      { category: 'Clothing', sales: 25600, percentage: 20 },
      { category: 'Books', sales: 14430, percentage: 12 }
    ]
  };

  const exportToPDF = () => {
    // In a real implementation, this would use a PDF generation library
    // For now, we'll simulate the export with a success message
    
    // Show a loading state
    toast.loading('Generating PDF...');
    
    // Simulate API delay
    setTimeout(() => {
      // Create a simple "download" by opening a new window with formatted content
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
                <div class="metric-value">$${reportData.totalSales.toLocaleString()}</div>
                <div class="metric-trend">+${reportData.monthlyGrowth}% from last month</div>
              </div>
              
              <div class="metric">
                <div class="metric-title">Total Orders</div>
                <div class="metric-value">${reportData.totalOrders}</div>
                <div class="metric-trend">This month</div>
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
                    <td>$${product.revenue.toLocaleString()}</td>
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
                    <span>$${category.sales.toLocaleString()}</span>
                  </div>
                  <div class="bar-container">
                    <div class="bar" style="width: ${category.percentage}%;"></div>
                  </div>
                  <div style="font-size: 12px; color: #666;">
                    ${category.percentage}% of total sales
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
      
      // Dismiss the loading toast and show success
      toast.dismiss();
      toast.success('Report exported successfully');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Summary Report</h1>
          <p className="text-muted-foreground">Comprehensive business overview and analytics</p>
        </div>
        <div className="flex gap-2">
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
            <div className="text-2xl font-bold">${reportData.totalSales.toLocaleString()}</div>
            <p className="text-xs text-green-600">+{reportData.monthlyGrowth}% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">This month</p>
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
            <CardDescription>Best performing items this month</CardDescription>
          </CardHeader>
          <CardContent>
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
                    <TableCell>${product.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.salesByCategory.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{category.category}</span>
                    <span>${category.sales.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className={`bg-primary h-2 rounded-full ${
                        category.percentage === 100 ? 'w-full' : 
                        category.percentage >= 75 ? 'w-3/4' :
                        category.percentage >= 66 ? 'w-2/3' :
                        category.percentage >= 50 ? 'w-1/2' :
                        category.percentage >= 33 ? 'w-1/3' :
                        category.percentage >= 25 ? 'w-1/4' :
                        'w-[' + category.percentage + '%]'
                      }`}
                    ></div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {category.percentage}% of total sales
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
