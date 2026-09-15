import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  FileBarChart,
  BookOpen,
  Users2,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  activeClass: string;
  idleIconClass: string;
}

const menuItems: MenuItem[] = [
  {
    title: 'EFD',
    description: 'Análise Fiscal Digital',
    icon: FileBarChart,
    path: '/efd',
    activeClass: 'bg-efd-primary text-white shadow-lg shadow-efd-primary/30',
    idleIconClass: 'group-hover/menu:text-efd-primary',
  },
  {
    title: 'ECF x ECD',
    description: 'Análise Contábil Fiscal',
    icon: BookOpen,
    path: '/ecf',
    activeClass: 'bg-ecf-primary text-white shadow-lg shadow-ecf-primary/30',
    idleIconClass: 'group-hover/menu:text-ecf-primary',
  },
  {
    title: 'eSocial',
    description: 'Gestão Trabalhista',
    icon: Users2,
    path: '/esocial',
    activeClass: 'bg-esocial-primary text-white shadow-lg shadow-esocial-primary/30',
    idleIconClass: 'group-hover/menu:text-esocial-primary',
  },
  {
    title: 'Reforma Tributária',
    description: 'Simulações CBS/IBS',
    icon: Scale,
    path: '/reforma-tributaria',
    activeClass: 'bg-reforma-primary text-white shadow-lg shadow-reforma-primary/30',
    idleIconClass: 'group-hover/menu:text-reforma-primary',
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar" variant="sidebar">
      <SidebarContent className="gap-0">
        {/* Header / Brand */}
        <div
          className={cn(
            "relative flex items-center overflow-hidden border-b border-sidebar-border",
            collapsed ? "justify-center px-2" : "justify-start gap-3 px-4",
            "pt-5 pb-4",
          )}
        >
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -top-12 -left-10 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />

          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center transition-transform duration-300 group-hover/sidebar:scale-105">
            <img src="/nawelllogo.png" alt="NAWELL" className="h-10 w-auto object-contain" />
          </div>

          {!collapsed && (
            <div className="relative min-w-0">
              <h1 className="text-base font-bold leading-tight tracking-tight text-sidebar-foreground">
                NAWELL
              </h1>
              <p className="truncate text-[11px] font-medium text-sidebar-foreground/60">
                Inteligência Tributária
              </p>
            </div>
          )}
        </div>

        {/* Modules */}
        <SidebarGroup className={cn("py-4", collapsed ? "px-2" : "px-3")}>
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase">
              Módulos
            </p>
          )}
          <SidebarGroupContent>
            <div className="space-y-1.5">
              {menuItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.title : undefined}
                    aria-current={active ? 'page' : undefined}
                    aria-label={`${item.title} — ${item.description}`}
                    className={cn(
                      "group/menu flex w-full items-center gap-3 rounded-xl py-2.5 text-left transition-all duration-200",
                      collapsed ? "justify-center px-0" : "px-3",
                      active
                        ? cn(item.activeClass, "font-semibold")
                        : "text-sidebar-foreground/70 hover:bg-white/[0.06] hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                        active ? "text-white" : item.idleIconClass,
                      )}
                    />
                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          "truncate text-[13px] font-semibold",
                          active ? "text-white" : "text-sidebar-foreground",
                        )}>
                          {item.title}
                        </p>
                        <p className={cn(
                          "truncate text-[11px]",
                          active ? "text-white/70" : "text-sidebar-foreground/50",
                        )}>
                          {item.description}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        {!collapsed && (
          <div className="mt-auto border-t border-sidebar-border px-3 py-3.5">
            <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-sidebar-foreground/80">
                  Sistema online
                </p>
                <p className="text-[10px] text-sidebar-foreground/40">
                  © 2026 NAWELL
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}