import { Building2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ECFDocumento } from "@/utils/ecfParser";

interface ECFBalancoProps {
  documento: ECFDocumento;
}

export function ECFBalanco({ documento }: ECFBalancoProps) {
  // Agrupar contas por tipo (simplificado - usa J100 se disponível)
  const calcularBalanco = () => {
    let ativo = 0;
    let passivo = 0;
    let pl = 0;

    for (const reg of documento.j100) {
      const conta = reg.campos.COD_CTA || "";
      const valor = Math.abs(reg.campos.VLR_CTA || 0);
      
      if (conta.startsWith("1")) {
        ativo += valor;
      } else if (conta.startsWith("2")) {
        passivo += valor;
      } else if (conta.startsWith("3")) {
        pl += valor;
      }
    }

    return { ativo, passivo, pl, passivoTotal: passivo + pl };
  };

  const { ativo, passivo, pl, passivoTotal } = calcularBalanco();
  const diferenca = ativo - passivoTotal;
  const balancado = Math.abs(diferenca) < 1;

  if (documento.j100.length === 0) {
    return (
      <Card className="p-6 border border-border/70 shadow-sm">
        <Alert className="border-ecf-primary/20 bg-ecf-primary/5">
          <AlertCircle className="h-4 w-4 text-ecf-primary" />
          <AlertDescription>
            Bloco J100 (saldos contábeis) não encontrado no arquivo ECF. 
            Não é possível gerar o balanço patrimonial.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-border/70 shadow-sm">
      <div className="relative pb-6 border-b border-border/60 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-ecf-primary/10 border border-ecf-primary/20">
            <Building2 className="w-8 h-8 text-ecf-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ecf-secondary">Balanço Patrimonial</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Estrutura patrimonial baseada em {documento.j100.length} contas
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Ativo */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-success" />
            <h3 className="text-lg font-semibold text-ecf-secondary">Ativo</h3>
          </div>
          <div className="p-4 rounded-lg bg-success/5 border border-success/20">
            <p className="text-sm text-muted-foreground mb-1">Total do Ativo</p>
            <p className="text-2xl font-bold text-success">
              R$ {ativo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Passivo + PL */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-ecf-primary" />
            <h3 className="text-lg font-semibold text-ecf-secondary">Passivo + Patrimônio Líquido</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-ecf-primary/5 border border-ecf-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Passivo</p>
              <p className="text-lg font-semibold text-ecf-primary">
                R$ {passivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-ecf-primary/5 border border-ecf-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Patrimônio Líquido</p>
              <p className="text-lg font-semibold text-ecf-primary">
                R$ {pl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
              <p className="text-sm text-muted-foreground mb-1">Total (Passivo + PL)</p>
              <p className="text-xl font-bold text-ecf-secondary">
                R$ {passivoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Validação */}
      {balancado ? (
        <Alert className="border-success/50 bg-success/5">
          <AlertCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            ✅ Balanço fechado corretamente: Ativo = Passivo + PL
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Divergência detectada: diferença de R$ {Math.abs(diferenca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
