import React, { useEffect } from 'react';
import { Package, BarChart3, Truck, Users } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="h-screen w-full bg-white flex items-center justify-center">
      <div className="text-center text-primary">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center animate-pulse delay-300">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <div className="absolute top-0 left-8 h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center animate-pulse delay-700">
              <Users className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4 text-primary">InventoryPro</h1>
        <p className="text-xl mb-8 text-muted-foreground">Complete Inventory Management Solution</p>
        
        <div className="flex justify-center items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce delay-150"></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce delay-300"></div>
        </div>
        
        <p className="text-sm mt-6 text-muted-foreground">Loading your workspace...</p>
      </div>
    </div>
  );
}