import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { A11yToggle } from '@/components/a11y/A11yToggle';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AppHeader() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-3xl supports-[backdrop-filter]:bg-background/70 shadow-sm">
      <div className="flex h-16 items-center gap-4 px-6">
        <SidebarTrigger
          aria-label="Abrir menu lateral"
          className="hover:bg-muted/60 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-md"
        />

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {/* Modo acessibilidade — leitor de tela / deficiência visual */}
          <A11yToggle variant="icon" />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            className="rounded-xl hover:bg-muted/60 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="Menu do usuário"
                className="gap-3 hover:bg-muted/60 rounded-xl transition-colors px-3"
              >
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center ring-1 ring-border">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-semibold">{user?.username}</span>
                  <span className="text-xs text-muted-foreground">Administrador</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 animate-scale-in rounded-xl border-border/60">
              <DropdownMenuLabel className="font-semibold">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg text-destructive focus:text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
