import React, { useState } from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { 
  Home, Users, Truck, Package, BarChart3, Tag, Receipt, Percent, 
  FileText, QrCode, Undo, TrendingUp, LogOut, Menu, CreditCard
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, permission: 'dashboard' },
  { id: 'bill', label: 'Billing/POS', icon: CreditCard, permission: 'invoice' },
  { id: 'add-users', label: 'Add Users', icon: Users, permission: 'add-users' },
  { id: 'users', label: 'Users', icon: Users, permission: 'users' },
  { id: 'suppliers', label: 'Supplier', icon: Truck, permission: 'suppliers' },
  { id: 'products', label: 'Product', icon: Package, permission: 'products' },
  { id: 'stocks', label: 'Stocks', icon: BarChart3, permission: 'stocks' },
  { id: 'category', label: 'Category', icon: Tag, permission: 'category' },
  { id: 'invoice', label: 'Invoice', icon: Receipt, permission: 'invoice' },
  { id: 'promotions', label: 'Promotions', icon: Percent, permission: 'promotions' },
  { id: 'summary-report', label: 'Summary Report', icon: FileText, permission: 'summary-report' },
  { id: 'grn', label: 'GRN', icon: FileText, permission: 'grn' },
  { id: 'barcode', label: 'Barcode', icon: QrCode, permission: 'barcode' },
  { id: 'supplier-return', label: 'Supplier Return', icon: Undo, permission: 'supplier-return' },
  { id: 'z-report', label: 'Z-Report', icon: TrendingUp, permission: 'z-report' },
];

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredMenuItems = menuItems.filter(item => 
    user?.permissions.includes(item.permission)
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="border-b p-4 h-16 flex items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <h2 className="text-lg font-semibold">InventoryPro</h2>
                <p className="text-xs text-muted-foreground">Management System</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-2">
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onNavigate(item.id)}
                      isActive={isActive}
                      className={`w-full justify-start transition-all duration-200 ${
                        isActive
                          ? 'bg-primary text-white shadow-sm border-l-4 border-l-primary-foreground/30'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <div className="border-t p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-lg font-semibold capitalize">
                {currentPage.replace('-', ' ')}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}