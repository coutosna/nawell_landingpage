export interface ItemNota {
  nItem: number;
  ncm: string;
  descricao_ncm: string;
  cfop: string;
  descricao_cfop: string;
  cst_ibs_cbs: string | number;
  descricao_cst: string;
  cclasstrib: string | null;
  descricao_cclasstrib: string | null;
  valor_unitario: number;
  quantidade: number;
  valor_total: number;
  pRedIBS_declarado?: number;
  pRedCBS_declarado?: number;
}

export interface Emitente {
  nome: string;
  cnpj: string;
  cnae: string;
  descricao_cnae: string;
}

export interface Nota {
  chave_nfe: string;
  numero: number;
  data_emissao: string;
  emitente: Emitente;
  itens: ItemNota[];
  valor_total_nota: number;
}

export type Severidade = "alta" | "media";

export interface Achado {
  nItem: number | null;
  tipo: string;
  severidade: Severidade;
  detalhe: string;
  valor_item?: number;
}

export interface ResultadoValidacao {
  chave_nfe: string;
  score_qualidade: number;
  exposicao_financeira: number;
  achados: Achado[];
}
