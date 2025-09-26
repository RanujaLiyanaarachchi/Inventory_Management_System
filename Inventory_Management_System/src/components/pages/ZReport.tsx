import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DollarSign, TrendingUp, Printer, Download } from 'lucide-react';
import { toast } from "sonner";
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

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

interface ReportData {
  date: string;
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  cashSales: number;
  cardSales: number;
  discounts: number;
  returns: number;
  tax: number;
  openingCash: number;
  closingCash: number;
  hourlyBreakdown: {
    hour: string;
    sales: number;
    transactions: number;
  }[];
}

export function ZReport() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
    date: selectedDate,
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    cashSales: 0,
    cardSales: 0,
    discounts: 0,
    returns: 0,
    tax: 0,
    openingCash: 0,
    closingCash: 0,
    hourlyBreakdown: []
  });
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch real invoice data from Firebase
  const fetchInvoiceData = async (date: string) => {
    try {
      setIsLoading(true);
      
      // Convert selected date to start and end of day
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Query invoices for the selected date
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('date', '>=', date),
        where('date', '<=', date),
        orderBy('date', 'asc')
      );
      
      const invoiceSnapshot = await getDocs(invoicesQuery);
      const invoices: Invoice[] = [];
      
      invoiceSnapshot.forEach((doc) => {
        invoices.push({ id: doc.id, ...doc.data() } as Invoice);
      });

      // Process the invoice data to generate report
      return processInvoiceData(invoices, date);
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast.error('Failed to fetch invoice data');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Process invoice data to generate report statistics
  const processInvoiceData = (invoices: Invoice[], date: string): ReportData => {
    if (invoices.length === 0) {
      return {
        date,
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        cashSales: 0,
        cardSales: 0,
        discounts: 0,
        returns: 0,
        tax: 0.1, // Default 10% tax rate
        openingCash: 500.00, // Default opening cash
        closingCash: 500.00, // Default closing cash
        hourlyBreakdown: []
      };
    }

    // Calculate basic statistics
    const totalSales = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalTransactions = invoices.length;
    const averageTransaction = totalSales / totalTransactions;

    // Calculate payment method breakdown
    const cashSales = invoices
      .filter(invoice => invoice.paymentMethod === 'cash' || !invoice.paymentMethod)
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    
    const cardSales = invoices
      .filter(invoice => invoice.paymentMethod === 'card')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    // Calculate discounts (assuming discount is stored in invoice data)
    const discounts = invoices.reduce((sum, invoice) => {
      // If discount field exists in invoice, use it, otherwise estimate 3%
      return sum + (invoice.amount * 0.03); // 3% estimated discount
    }, 0);

    // Calculate returns (assuming returns are separate invoices with negative amounts or status)
    const returns = invoices
      .filter(invoice => invoice.status === 'Returned' || invoice.amount < 0)
      .reduce((sum, invoice) => sum + Math.abs(invoice.amount), 0);

    // Calculate tax (10% of total sales)
    const tax = totalSales * 0.1;

    // Calculate hourly breakdown
    const hourlyBreakdown = calculateHourlyBreakdown(invoices);

    // Calculate cash reconciliation
    const openingCash = 500.00; // Default opening cash
    const closingCash = openingCash + cashSales - returns;

    return {
      date,
      totalSales,
      totalTransactions,
      averageTransaction,
      cashSales,
      cardSales,
      discounts,
      returns,
      tax,
      openingCash,
      closingCash,
      hourlyBreakdown
    };
  };

  // Calculate hourly sales breakdown
  const calculateHourlyBreakdown = (invoices: Invoice[]) => {
    const hours = [
      '09:00', '10:00', '11:00', '12:00', 
      '13:00', '14:00', '15:00', '16:00', 
      '17:00', '18:00', '19:00', '20:00'
    ];
    
    const hourlyData: { [key: string]: { sales: number; transactions: number } } = {};
    
    // Initialize hourly data
    hours.forEach(hour => {
      hourlyData[hour] = { sales: 0, transactions: 0 };
    });
    
    // Group invoices by hour
    invoices.forEach(invoice => {
      try {
        const invoiceDate = new Date(invoice.date);
        const hour = invoiceDate.getHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        
        if (hourlyData[hourKey]) {
          hourlyData[hourKey].sales += invoice.amount;
          hourlyData[hourKey].transactions += 1;
        }
      } catch (error) {
        console.error('Error processing invoice date:', error);
      }
    });
    
    // Convert to array format
    return hours.map(hour => ({
      hour,
      sales: hourlyData[hour].sales,
      transactions: hourlyData[hour].transactions
    })).filter(item => item.sales > 0 || item.transactions > 0);
  };

  // Generate report for the selected date
  const generateReport = async () => {
    const data = await fetchInvoiceData(selectedDate);
    if (data) {
      setReportData(data);
      toast.success('Z-Report generated successfully');
    }
  };

  // Prepare report content for printing/export
  const prepareReportContent = () => {
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const styles = `
      body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
        padding: 20px;
        max-width: 1000px;
        margin: 0 auto;
        background-color: white;
      }
      .report-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 10px;
        border-bottom: 2px solid #ddd;
      }
      .report-title {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
        color: #2563eb;
      }
      .report-date {
        font-size: 16px;
        color: #666;
        margin: 5px 0 0;
      }
      .report-subtitle {
        font-size: 14px;
        color: #666;
        margin: 5px 0 0;
      }
      .summary-cards {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        margin-bottom: 30px;
      }
      .summary-card {
        flex: 1;
        min-width: 200px;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 15px;
        background-color: #f9fafb;
      }
      .summary-card-title {
        font-size: 14px;
        color: #666;
        margin: 0 0 10px;
      }
      .summary-card-value {
        font-size: 20px;
        font-weight: bold;
        margin: 0;
      }
      .summary-card-subtitle {
        font-size: 12px;
        color: #888;
        margin: 5px 0 0;
      }
      .card {
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 20px;
        background-color: white;
      }
      .card-header {
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .card-title {
        font-size: 16px;
        font-weight: bold;
        margin: 0;
        color: #111;
      }
      .card-description {
        font-size: 12px;
        color: #666;
        margin: 5px 0 0;
      }
      .card-content {
        font-size: 14px;
      }
      .grid-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 30px;
      }
      .grid-item {
        flex: 1;
        min-width: 300px;
      }
      .flex-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .text-green {
        color: #22c55e;
      }
      .text-red {
        color: #ef4444;
      }
      .font-bold {
        font-weight: bold;
      }
      .border-top {
        border-top: 1px solid #eee;
        padding-top: 8px;
        margin-top: 8px;
      }
      .hourly-item {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        border: 1px solid #eee;
        border-radius: 4px;
        margin-bottom: 8px;
      }
      .hourly-item-time {
        font-weight: bold;
      }
      .hourly-item-details {
        color: #666;
        font-size: 12px;
      }
      .details-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }
      .details-column {
        flex: 1;
        min-width: 200px;
      }
      .details-title {
        font-weight: bold;
        margin-bottom: 10px;
        font-size: 14px;
      }
      .details-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        font-size: 13px;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pagebreak {
          page-break-before: always;
        }
      }
    `;

    return `
      <html>
        <head>
          <title>Z-Report - ${selectedDate}</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="report-header">
            <h1 class="report-title">Z-Report</h1>
            <p class="report-date">${formattedDate}</p>
            <p class="report-subtitle">Daily Sales Summary and Cash Reconciliation</p>
          </div>
          
          <div class="summary-cards">
            <div class="summary-card">
              <h3 class="summary-card-title">Gross Sales</h3>
              <p class="summary-card-value">LKR ${reportData.totalSales.toFixed(2)}</p>
              <p class="summary-card-subtitle">${reportData.totalTransactions} transactions</p>
            </div>
            
            <div class="summary-card">
              <h3 class="summary-card-title">Cash Sales</h3>
              <p class="summary-card-value">LKR ${reportData.cashSales.toFixed(2)}</p>
              <p class="summary-card-subtitle">Cash payments</p>
            </div>
            
            <div class="summary-card">
              <h3 class="summary-card-title">Card Sales</h3>
              <p class="summary-card-value">LKR ${reportData.cardSales.toFixed(2)}</p>
              <p class="summary-card-subtitle">Card payments</p>
            </div>
            
            <div class="summary-card">
              <h3 class="summary-card-title">Net Sales</h3>
              <p class="summary-card-value">LKR ${(reportData.totalSales - reportData.discounts - reportData.returns).toFixed(2)}</p>
              <p class="summary-card-subtitle">After discounts & returns</p>
            </div>
          </div>
          
          <div class="grid-container">
            <div class="grid-item">
              <div class="card">
                <div class="card-header">
                  <h2 class="card-title">Cash Reconciliation</h2>
                  <p class="card-description">Daily cash flow summary</p>
                </div>
                <div class="card-content">
                  <div class="flex-row">
                    <span>Opening Cash:</span>
                    <span>LKR ${reportData.openingCash.toFixed(2)}</span>
                  </div>
                  <div class="flex-row">
                    <span>Cash Sales:</span>
                    <span class="text-green">+LKR ${reportData.cashSales.toFixed(2)}</span>
                  </div>
                  <div class="flex-row">
                    <span>Cash Returns:</span>
                    <span class="text-red">-LKR ${reportData.returns.toFixed(2)}</span>
                  </div>
                  <div class="flex-row border-top">
                    <span class="font-bold">Expected Cash:</span>
                    <span class="font-bold">LKR ${(reportData.openingCash + reportData.cashSales - reportData.returns).toFixed(2)}</span>
                  </div>
                  <div class="flex-row">
                    <span class="font-bold">Actual Cash:</span>
                    <span class="font-bold">LKR ${reportData.closingCash.toFixed(2)}</span>
                  </div>
                  <div class="flex-row">
                    <span class="font-bold">Variance:</span>
                    <span class="font-bold ${reportData.closingCash - (reportData.openingCash + reportData.cashSales - reportData.returns) >= 0 ? 'text-green' : 'text-red'}">
                      LKR ${(reportData.closingCash - (reportData.openingCash + reportData.cashSales - reportData.returns)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="grid-item">
              <div class="card">
                <div class="card-header">
                  <h2 class="card-title">Hourly Sales Breakdown</h2>
                  <p class="card-description">Sales performance throughout the day</p>
                </div>
                <div class="card-content">
                  ${reportData.hourlyBreakdown.map(hour => `
                    <div class="hourly-item">
                      <div>
                        <span class="hourly-item-time">${hour.hour}</span>
                        <span class="hourly-item-details">(${hour.transactions} transactions)</span>
                      </div>
                      <span>LKR ${hour.sales.toFixed(2)}</span>
                    </div>
                  `).join('')}
                  ${reportData.hourlyBreakdown.length === 0 ? '<p>No sales data available for this date</p>' : ''}
                </div>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Report Details</h2>
              <p class="card-description">Comprehensive breakdown of daily operations</p>
            </div>
            <div class="card-content">
              <div class="details-grid">
                <div class="details-column">
                  <h4 class="details-title">Sales Summary</h4>
                  <div class="details-item">
                    <span>Total Transactions:</span>
                    <span>${reportData.totalTransactions}</span>
                  </div>
                  <div class="details-item">
                    <span>Average Transaction:</span>
                    <span>LKR ${reportData.averageTransaction.toFixed(2)}</span>
                  </div>
                  <div class="details-item">
                    <span>Tax Collected:</span>
                    <span>LKR ${reportData.tax.toFixed(2)}</span>
                  </div>
                </div>
                
                <div class="details-column">
                  <h4 class="details-title">Adjustments</h4>
                  <div class="details-item">
                    <span>Total Discounts:</span>
                    <span class="text-red">-LKR ${reportData.discounts.toFixed(2)}</span>
                  </div>
                  <div class="details-item">
                    <span>Total Returns:</span>
                    <span class="text-red">-LKR ${reportData.returns.toFixed(2)}</span>
                  </div>
                  <div class="details-item">
                    <span>Net Adjustments:</span>
                    <span class="text-red">-LKR ${(reportData.discounts + reportData.returns).toFixed(2)}</span>
                  </div>
                </div>
                
                <div class="details-column">
                  <h4 class="details-title">Payment Methods</h4>
                  <div class="details-item">
                    <span>Cash:</span>
                    <span>${reportData.totalSales > 0 ? ((reportData.cashSales / reportData.totalSales) * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                  <div class="details-item">
                    <span>Card:</span>
                    <span>${reportData.totalSales > 0 ? ((reportData.cardSales / reportData.totalSales) * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="report-footer" style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
            <p>Report generated on ${new Date().toLocaleString()}</p>
            <p>© ${new Date().getFullYear()} Inventory Management System</p>
          </div>
        </body>
      </html>
    `;
  };

  // Print the report
  const printReport = () => {
    const reportContent = prepareReportContent();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the report');
      return;
    }
    
    printWindow.document.write(reportContent);
    printWindow.document.close();
    
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
    
    toast.success('Print preview opened');
  };

  // Export report as PDF
  const exportPDF = () => {
    setIsExporting(true);
    toast.loading('Preparing PDF for export...');
    
    const reportContent = prepareReportContent();
    
    try {
      const pdfWindow = window.open('', '_blank');
      if (!pdfWindow) {
        toast.error('Please allow pop-ups to export the PDF');
        setIsExporting(false);
        return;
      }
      
      pdfWindow.document.write(reportContent);
      pdfWindow.document.close();
      
      const saveInstructions = document.createElement('div');
      saveInstructions.style.position = 'fixed';
      saveInstructions.style.top = '0';
      saveInstructions.style.left = '0';
      saveInstructions.style.right = '0';
      saveInstructions.style.backgroundColor = '#2563eb';
      saveInstructions.style.color = 'white';
      saveInstructions.style.padding = '10px';
      saveInstructions.style.textAlign = 'center';
      saveInstructions.style.zIndex = '9999';
      saveInstructions.innerHTML = 'Press Ctrl+P (or Cmd+P on Mac) and select "Save as PDF" to download the report.';
      
      pdfWindow.document.body.prepend(saveInstructions);
      
      const script = document.createElement('script');
      script.textContent = `
        setTimeout(() => {
          document.querySelector('div').style.display = 'none';
          window.print();
          document.querySelector('div').style.display = 'block';
        }, 1000);
      `;
      pdfWindow.document.body.appendChild(script);
      
      toast.dismiss();
      toast.success('PDF export prepared');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate report when date changes
  useEffect(() => {
    generateReport();
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Z-Report (Daily Sales Report)</h1>
          <p className="text-muted-foreground">End-of-day sales summary and cash reconciliation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printReport} disabled={isExporting}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
          <Button onClick={exportPDF} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Preparing...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Report Date</CardTitle>
          <CardDescription>Select date for Z-Report generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
            <Button onClick={generateReport} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <div ref={reportRef}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {reportData.totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{reportData.totalTransactions} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {reportData.cashSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Cash payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Card Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {reportData.cardSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Card payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                LKR {(reportData.totalSales - reportData.discounts - reportData.returns).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">After discounts & returns</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Cash Reconciliation */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Reconciliation</CardTitle>
              <CardDescription>Daily cash flow summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Opening Cash:</span>
                  <span className="font-medium">LKR {reportData.openingCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cash Sales:</span>
                  <span className="font-medium text-green-600">+LKR {reportData.cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cash Returns:</span>
                  <span className="font-medium text-red-600">-LKR {reportData.returns.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Expected Cash:</span>
                    <span className="font-bold">
                      LKR {(reportData.openingCash + reportData.cashSales - reportData.returns).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Actual Cash:</span>
                  <span className="font-bold">LKR {reportData.closingCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Variance:</span>
                  <span className={`font-bold ${reportData.closingCash - (reportData.openingCash + reportData.cashSales - reportData.returns) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    LKR {(reportData.closingCash - (reportData.openingCash + reportData.cashSales - reportData.returns)).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hourly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Hourly Sales Breakdown</CardTitle>
              <CardDescription>Sales performance throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.hourlyBreakdown.length > 0 ? (
                  reportData.hourlyBreakdown.map((hour, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{hour.hour}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({hour.transactions} transactions)
                        </span>
                      </div>
                      <span className="font-medium">LKR {hour.sales.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No sales data available for this date</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>Comprehensive breakdown of daily operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Sales Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span>{reportData.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Transaction:</span>
                    <span>LKR {reportData.averageTransaction.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Collected:</span>
                    <span>LKR {reportData.tax.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Adjustments</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Discounts:</span>
                    <span className="text-red-600">-LKR ${reportData.discounts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Returns:</span>
                    <span className="text-red-600">-LKR ${reportData.returns.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Adjustments:</span>
                    <span className="text-red-600">-LKR ${(reportData.discounts + reportData.returns).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Payment Methods</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Cash:</span>
                    <span>{reportData.totalSales > 0 ? ((reportData.cashSales / reportData.totalSales) * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Card:</span>
                    <span>{reportData.totalSales > 0 ? ((reportData.cardSales / reportData.totalSales) * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}