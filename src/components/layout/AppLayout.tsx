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
      {/* Skip to content — leitor de tela pula direto para o conteúdo */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[9999] focus:top-4 focus:left-4 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Pular para o conteúdo
      </a>

      <div className="h-screen flex w-full bg-background relative overflow-hidden">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <AppHeader />

          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-auto scrollbar-thin focus:outline-none"
          >
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-full animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
