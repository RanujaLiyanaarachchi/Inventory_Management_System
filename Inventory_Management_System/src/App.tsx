import React, { useState, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { SplashScreen } from './components/pages/SplashScreen';
import { LoginPage } from './components/pages/LoginPage';
import { Dashboard } from './components/pages/Dashboard';
import { AddUsers } from './components/pages/AddUsers';
import { UsersPage } from './components/pages/UsersPage';
import { Suppliers } from './components/pages/Suppliers';
import { Products } from './components/pages/Products';
import { Stocks } from './components/pages/Stocks';
import { Categories } from './components/pages/Categories';
import { Invoice } from './components/pages/Invoice';
import { BillPage } from './components/pages/BillPage';
import { EnhancedBarcode } from './components/pages/Barcode';
import { GRN } from './components/pages/GRN';
import { Promotions } from './components/pages/Promotions';
import { SummaryReport } from './components/pages/SummaryReport';
import { ZReport } from './components/pages/ZReport';
import { SupplierReturn } from './components/pages/SupplierReturn';
import { Button } from './components/ui/button';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // Show splash screen on initial load
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    // Check if user has permission for the current page
    const menuItems = [
      { id: 'dashboard', permission: 'dashboard' },
      { id: 'bill', permission: 'bill' },
      { id: 'add-users', permission: 'add-users' },
      { id: 'users', permission: 'users' },
      { id: 'suppliers', permission: 'suppliers' },
      { id: 'products', permission: 'products' },
      { id: 'stocks', permission: 'stocks' },
      { id: 'category', permission: 'category' },
      { id: 'invoice', permission: 'invoice' },
      { id: 'promotions', permission: 'promotions' },
      { id: 'summary-report', permission: 'summary-report' },
      { id: 'grn', permission: 'grn' },
      { id: 'barcode', permission: 'barcode' },
      { id: 'supplier-return', permission: 'supplier-return' },
      { id: 'z-report', permission: 'z-report' },
    ];

    const currentMenuItem = menuItems.find(item => item.id === currentPage);
    const hasPermission = currentMenuItem ? user.permissions.includes(currentMenuItem.permission) : true;

    if (!hasPermission) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
            <Button onClick={() => setCurrentPage('dashboard')} className="mt-4">
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'bill':
        return <BillPage />;
      case 'add-users':
        return <AddUsers />;
      case 'users':
        return <UsersPage />;
      case 'suppliers':
        return <Suppliers />;
      case 'products':
        return <Products />;
      case 'stocks':
        return <Stocks />;
      case 'category':
        return <Categories />;
      case 'invoice':
        return <Invoice />;
      case 'promotions':
        return <Promotions />;
      case 'summary-report':
        return <SummaryReport />;
      case 'grn':
        return <GRN />;
      case 'barcode':
        return <EnhancedBarcode />;
      case 'supplier-return':
        return <SupplierReturn />;
      case 'z-report':
        return <ZReport />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <AppContent />
        <Toaster />
      </div>
    </AuthProvider>
  );
}