import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { SidebarProvider } from '@/components/ui/sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="h-screen flex w-full bg-background relative overflow-hidden">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <AppHeader />
          
          <main className="flex-1 overflow-auto scrollbar-thin">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-full animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
