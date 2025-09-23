import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DollarSign, TrendingUp, Printer, Download } from 'lucide-react';
import { toast } from "sonner";

export function ZReport() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [reportData, setReportData] = useState({
    date: selectedDate,
    totalSales: 5247.50,
    totalTransactions: 28,
    averageTransaction: 187.41,
    cashSales: 2100.00,
    cardSales: 3147.50,
    discounts: 125.75,
    returns: 89.25,
    tax: 524.75,
    openingCash: 500.00,
    closingCash: 2600.00,
    hourlyBreakdown: [
      { hour: '09:00', sales: 245.50, transactions: 3 },
      { hour: '10:00', sales: 412.25, transactions: 5 },
      { hour: '11:00', sales: 638.75, transactions: 4 },
      { hour: '12:00', sales: 821.00, transactions: 6 },
      { hour: '13:00', sales: 567.25, transactions: 3 },
      { hour: '14:00', sales: 743.50, transactions: 4 },
      { hour: '15:00', sales: 892.75, transactions: 3 }
    ]
  });

  // Generate random data based on the selected date
  const generateRandomData = (date: string) => {
    // Seed random number generator with the date for consistent results
    const seed = Date.parse(date);
    const randomFactor = ((seed % 100) / 100) * 0.5 + 0.75; // Generate between 0.75 and 1.25
    
    const totalSales = Math.round(5000 * randomFactor * 100) / 100;
    const totalTransactions = Math.round(30 * randomFactor);
    const averageTransaction = Math.round((totalSales / totalTransactions) * 100) / 100;
    const cashSales = Math.round(totalSales * 0.4 * 100) / 100;
    const cardSales = Math.round((totalSales - cashSales) * 100) / 100;
    const discounts = Math.round(totalSales * 0.03 * 100) / 100;
    const returns = Math.round(totalSales * 0.02 * 100) / 100;
    const tax = Math.round(totalSales * 0.1 * 100) / 100;
    
    // Generate hourly breakdown
    const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
    let hourlyBreakdown = [];
    let totalHourlySales = 0;
    
    for (let i = 0; i < hours.length; i++) {
      const hourSeed = seed + i;
      const hourRandomizer = ((hourSeed % 100) / 100) * 0.5 + 0.75;
      const transactions = Math.max(1, Math.round(5 * hourRandomizer));
      const sales = Math.round(totalSales / hours.length * hourRandomizer * 100) / 100;
      totalHourlySales += sales;
      
      hourlyBreakdown.push({
        hour: hours[i],
        sales,
        transactions
      });
    }
    
    // Adjust last hour to make sure total matches
    if (hourlyBreakdown.length > 0) {
      const lastHour = hourlyBreakdown[hourlyBreakdown.length - 1];
      lastHour.sales = Math.round((lastHour.sales + (totalSales - totalHourlySales)) * 100) / 100;
    }
    
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
      openingCash: 500.00,
      closingCash: 500.00 + cashSales - returns,
      hourlyBreakdown
    };
  };

  // Generate report for the selected date
  const generateReport = () => {
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const newData = generateRandomData(selectedDate);
      setReportData(newData);
      setIsLoading(false);
      toast.success('Z-Report generated successfully');
    }, 800);
  };

  // Prepare report content for printing/export
  const prepareReportContent = () => {
    // Format date for display
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create beautiful CSS styling for the report
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

    // Create HTML content for the report
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
          
          <!-- Summary Cards -->
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
          
          <!-- Main Content -->
          <div class="grid-container">
            <!-- Cash Reconciliation -->
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
            
            <!-- Hourly Breakdown -->
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
                </div>
              </div>
            </div>
          </div>
          
          <!-- Additional Details -->
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
                    <span>${((reportData.cashSales / reportData.totalSales) * 100).toFixed(1)}%</span>
                  </div>
                  <div class="details-item">
                    <span>Card:</span>
                    <span>${((reportData.cardSales / reportData.totalSales) * 100).toFixed(1)}%</span>
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
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the report');
      return;
    }
    
    printWindow.document.write(reportContent);
    printWindow.document.close();
    
    // Add event listener to trigger print when content is loaded
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
        // No need to close the window after printing - user can close it
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
      // Create a new window for PDF export
      const pdfWindow = window.open('', '_blank');
      if (!pdfWindow) {
        toast.error('Please allow pop-ups to export the PDF');
        setIsExporting(false);
        return;
      }
      
      pdfWindow.document.write(reportContent);
      pdfWindow.document.close();
      
      // Add guidance text for saving as PDF
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
      
      // Add script to trigger print dialog after a delay
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

      {/* Report Content - Referenced for printing */}
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
                {reportData.hourlyBreakdown.map((hour, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{hour.hour}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({hour.transactions} transactions)
                      </span>
                    </div>
                    <span className="font-medium">LKR {hour.sales.toFixed(2)}</span>
                  </div>
                ))}
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
                    <span className="text-red-600">-LKR {reportData.discounts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Returns:</span>
                    <span className="text-red-600">-LKR {reportData.returns.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Adjustments:</span>
                    <span className="text-red-600">-LKR {(reportData.discounts + reportData.returns).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Payment Methods</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Cash:</span>
                    <span>{((reportData.cashSales / reportData.totalSales) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Card:</span>
                    <span>{((reportData.cardSales / reportData.totalSales) * 100).toFixed(1)}%</span>
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
