import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export const WelcomeHero: React.FC = () => {
  return (
    <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-inner">
      {/* Animated gradient mesh - mais vibrante */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-accent/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-success/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>
      
      {/* Grid pattern overlay com efeito de profundidade */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
      
      {/* Destaques luminosos animados */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full animate-bounce-subtle opacity-70 shadow-glow-sm" />
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-accent rounded-full animate-bounce-subtle animation-delay-2000 opacity-70 shadow-glow-sm" />
      <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-success rounded-full animate-bounce-subtle animation-delay-4000 opacity-70 shadow-glow-sm" />
      
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-24 lg:py-36 relative">
        <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Badge com efeito shimmer melhorado */}
          <div className="animate-fade-in-down">
            <Badge 
              variant="outline" 
              className="mb-6 px-6 py-3 text-sm bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-primary/30 hover:bg-primary/20 transition-all duration-300 hover:scale-105 shadow-xl shadow-primary/20 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/30"
            >
              <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
              Análise Fiscal Inteligente
            </Badge>
          </div>
          
          {/* Título principal com gradiente animado melhorado */}
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold mb-6 animate-fade-in-up">
            <span className="bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent leading-tight tracking-tighter inline-block gradient-animate drop-shadow-2xl">
              EFD
            </span>
          </h1>
          
          {/* Subtítulo com animação */}
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-balance font-medium animate-fade-in-up animation-delay-200 px-4">
            Detecção automática de divergências e validação inteligente de regimes tributários <span className="text-primary font-semibold">PIS/COFINS</span>
          </p>
          
          {/* Estatísticas visuais melhoradas */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto pt-6 sm:pt-8 animate-fade-in-up animation-delay-400 px-4">
            {[
              { value: "100%", label: "Automatizado", color: "from-primary to-accent" },
              { value: "< 1min", label: "Análise", color: "from-accent to-success" },
              { value: "24/7", label: "Disponível", color: "from-success to-primary" }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-6 hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 group border border-white/20"
              >
                <div className={`text-xl sm:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1 sm:mb-2 group-hover:scale-110 transition-transform`}>
                  {stat.value}
                </div>
                <div className="text-[0.65rem] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Gradiente bottom fade melhorado */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent" />
    </div>
  );
};