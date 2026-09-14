import ncmRaw from "./_clean_ncm.json";
import cnaeRaw from "./_clean_cnae.json";
import cstRaw from "./_clean_cst.json";
import cclassRaw from "./_clean_cclasstrib.json";
import cfopRaw from "./cfop_completo.json";

interface NcmRow {
  ncm: string;
  descricao: string;
  aliquota_ipi: string | number | null;
}
interface CnaeRow {
  cnae: string;
  descricao: string;
}
interface CstRow {
  "CST-IBS/CBS": string;
  indNFe: "Sim" | "Não";
  [key: string]: unknown;
}
export interface CClassTribRow {
  "CST-IBS/CBS": string;
  cClassTrib: string;
  "Nome cClassTrib": string;
  pRedIBS: number;
  pRedCBS: number;
  indNFe: number;
  dIniVig: string | null;
  dFimVig: string | null;
  Link: string | null;
  [key: string]: unknown;
}
interface CfopRow {
  cfop: string;
  descricao: string;
}

export const NCM: NcmRow[] = ncmRaw as NcmRow[];
export const CNAE: CnaeRow[] = cnaeRaw as CnaeRow[];
export const CST: CstRow[] = cstRaw as CstRow[];
export const CCLASS: CClassTribRow[] = cclassRaw as CClassTribRow[];
export const CFOP: CfopRow[] = cfopRaw as CfopRow[];

export const NCM_SET = new Set(NCM.map((n) => n.ncm));
export const CNAE_SET = new Set(CNAE.map((c) => c.cnae));
export const CFOP_SET = new Set(CFOP.map((c) => c.cfop));
export const CCLASS_BY_CODE = new Map(CCLASS.map((c) => [c.cClassTrib, c]));
