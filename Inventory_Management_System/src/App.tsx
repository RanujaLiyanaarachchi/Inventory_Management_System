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
    switch (currentPage) {
      case 'dashboard':
        return (
          <ProtectedRoute permission="dashboard">
            <Dashboard />
          </ProtectedRoute>
        );
      case 'bill':
        return (
          <ProtectedRoute permission="bill">
            <BillPage />
          </ProtectedRoute>
        );
      case 'add-users':
        return (
          <ProtectedRoute permission="add-users">
            <AddUsers />
          </ProtectedRoute>
        );
      case 'users':
        return (
          <ProtectedRoute permission="users">
            <UsersPage />
          </ProtectedRoute>
        );
      case 'suppliers':
        return (
          <ProtectedRoute permission="suppliers">
            <Suppliers />
          </ProtectedRoute>
        );
      case 'products':
        return (
          <ProtectedRoute permission="products">
            <Products />
          </ProtectedRoute>
        );
      case 'stocks':
        return (
          <ProtectedRoute permission="stocks">
            <Stocks />
          </ProtectedRoute>
        );
      case 'category':
        return (
          <ProtectedRoute permission="category">
            <Categories />
          </ProtectedRoute>
        );
      case 'invoice':
        return (
          <ProtectedRoute permission="invoice">
            <Invoice />
          </ProtectedRoute>
        );
      case 'promotions':
        return (
          <ProtectedRoute permission="promotions">
            <Promotions />
          </ProtectedRoute>
        );
      case 'summary-report':
        return (
          <ProtectedRoute permission="summary-report">
            <SummaryReport />
          </ProtectedRoute>
        );
      case 'grn':
        return (
          <ProtectedRoute permission="grn">
            <GRN />
          </ProtectedRoute>
        );
      case 'barcode':
        return (
          <ProtectedRoute permission="barcode">
            <EnhancedBarcode />
          </ProtectedRoute>
        );
      case 'supplier-return':
        return (
          <ProtectedRoute permission="supplier-return">
            <SupplierReturn />
          </ProtectedRoute>
        );
      case 'z-report':
        return (
          <ProtectedRoute permission="z-report">
            <ZReport />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute permission="dashboard">
            <Dashboard />
          </ProtectedRoute>
        );
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