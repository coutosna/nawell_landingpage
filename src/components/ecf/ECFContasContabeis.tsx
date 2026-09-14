import { FileText, Search } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ECFDocumento } from "@/utils/ecfParser";

interface ECFContasContabeisProps {
  documento: ECFDocumento;
}

export function ECFContasContabeis({ documento }: ECFContasContabeisProps) {
  const [busca, setBusca] = useState("");

  // Extrair contas do J050
  const contas = documento.j050.map(reg => ({
    codigo: reg.campos.COD_CTA,
    nome: reg.campos.NOME_CTA,
    nivel: reg.campos.NIVEL,
    natureza: reg.campos.NAT_CTA,
  }));

  // Filtrar contas
  const contasFiltradas = contas.filter(conta =>
    conta.codigo?.toLowerCase().includes(busca.toLowerCase()) ||
    conta.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  const getTipoConta = (codigo: string) => {
    if (!codigo) return "Outros";
    const primeiro = codigo.charAt(0);
    switch (primeiro) {
      case "1": return "Ativo";
      case "2": return "Passivo";
      case "3": return "Patrimônio Líquido";
      case "4": return "Receitas";
      case "5": return "Custos";
      case "6": return "Despesas";
      case "7": return "Resultado";
      default: return "Outros";
    }
  };

  const getCorTipo = (tipo: string) => {
    switch (tipo) {
      case "Ativo": return "bg-success/10 text-success border-success/20";
      case "Passivo": return "bg-ecf-primary/10 text-ecf-primary border-ecf-primary/20";
      case "Patrimônio Líquido": return "bg-ecf-primary/10 text-ecf-primary border-ecf-primary/20";
      case "Receitas": return "bg-success/10 text-success border-success/20";
      case "Custos": return "bg-warning/10 text-warning border-warning/20";
      case "Despesas": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted/10 text-muted-foreground border-border/20";
    }
  };

  if (documento.j050.length === 0) {
    return (
      <Card className="p-6 border border-border/70 shadow-sm">
        <p className="text-center text-muted-foreground">
          Plano de contas (J050) não encontrado no arquivo ECF
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-border/70 shadow-sm">
      <div className="relative pb-6 border-b border-border/60 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-ecf-primary/10 border border-ecf-primary/20">
            <FileText className="w-8 h-8 text-ecf-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ecf-secondary">Plano de Contas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {contas.length} contas contábeis cadastradas
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou nome da conta..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome da Conta</TableHead>
              <TableHead className="text-center">Nível</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-center">Natureza</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contasFiltradas.slice(0, 100).map((conta, idx) => {
              const tipo = getTipoConta(conta.codigo || "");
              return (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm">{conta.codigo}</TableCell>
                  <TableCell>{conta.nome}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{conta.nivel}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCorTipo(tipo)}>{tipo}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{conta.natureza}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {contasFiltradas.length > 100 && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Mostrando 100 de {contasFiltradas.length} contas. Use a busca para refinar.
        </p>
      )}
    </Card>
  );
}
