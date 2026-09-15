import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Evita "tela branca": se um componente suspenso lançar um erro em tempo de
 * execução, mostra uma mensagem legível e uma ação de recarregar a página em
 * vez de deixar a tela em branco.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Erro de renderização capturado pelo ErrorBoundary:', error);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden="true" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Ocorreu um erro ao exibir este conteúdo
          </h2>
          <p className="text-muted-foreground mb-6">
            Recarregue a página para continuar. Se o problema persistir, contate o suporte.
          </p>
          <Button onClick={this.handleReload} variant="gradient">
            <RotateCcw className="mr-2 h-4 w-4" />
            Recarregar página
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}