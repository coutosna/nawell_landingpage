/**
 * Parser completo para arquivos EFD Contribuições
 * Extrai todos os dados relevantes para análise fiscal
 */

import { buscarAliquotaNCM } from './ncmTable';
import { 
  calcularRiscoFiscalItem, 
  consolidarRiscoFiscal, 
  type RiscoFiscalItem,
  type ResumoRiscoFiscal 
} from './fiscalCalculations';
import { classifyCfop, isCfopSaidaReceita, eixoOperacao } from './cfopPolicyMonolith';
import { parseEFDIcmsIpi, type EFDIcmsIpiData, type ConferenciaDeFechamento } from './efdIcmsIpiParser';

/**
 * CSTs de PIS/COFINS que NÃO geram débito na saída
 * (monofásico-revenda, ST, alíquota zero, isenção, não incidência e suspensão).
 * Nessas hipóteses o valor "devido" não é alíquota cheia sobre a base — evita
 * divergências fantasmas e multas indevidas.
 */
const CST_SEM_INCIDENCIA = new Set(['04', '05', '06', '07', '08', '09']);

/** Considera se o CST permite débito de PIS/COFINS */
export const cstPermiteDebito = (cst: string): boolean =>
  !!cst && !CST_SEM_INCIDENCIA.has(cst);

export type LeiauteSped = 'efd-contribuicoes' | 'efd-icms-ipi' | 'desconhecido';

/** Registros exclusivos de cada obrigação — a presença deles identifica o arquivo */
const MARCADORES_CONTRIBUICOES = ['0110', '0111', 'M001', 'M100', 'M200', 'M210', 'M500', 'M600', 'M610', 'A001', 'F001', '1001', '1100', '1500'];
const MARCADORES_ICMS_IPI = ['0005', '0220', '0460', 'E001', 'E100', 'E110', 'E111', 'E200', 'E210', 'E500', 'E510', 'G001', 'G125', 'K001', 'K200', 'K230', 'C197', 'D190'];

/** Identifica a obrigação do arquivo para não analisar SPED Fiscal como se fosse EFD-Contribuições */
export const detectarLeiaute = (content: string): LeiauteSped => {
  const registros = new Set<string>();
  for (const linha of content.split('\n')) {
    const reg = linha.split('|')[1];
    if (reg) registros.add(reg);
  }
  const contrib = MARCADORES_CONTRIBUICOES.filter(r => registros.has(r)).length;
  const icms = MARCADORES_ICMS_IPI.filter(r => registros.has(r)).length;
  if (contrib > icms) return 'efd-contribuicoes';
  if (icms > contrib) return 'efd-icms-ipi';
  return 'desconhecido';
};

/** Considera se a linha é uma saída (CFOP 5xxx, 6xxx ou 7xxx) */
export const isCfopSaida = (cfop: string): boolean =>
  eixoOperacao(cfop) === 'saida';

/** Exportações (CFOP 7xxx) não geram débito de PIS/COFINS */
export const isCfopExportacao = (cfop: string): boolean =>
  isCfopSaida(cfop) && String(cfop).trim().startsWith('7');

/** Decisão única de apuração de débito de PIS/COFINS para uma linha */
export const apuraDebitoPisCofins = (venda: {
  cfop: string;
  pisCst: string;
  cofinsCst: string;
}): boolean =>
  isCfopSaida(venda.cfop) &&
  !isCfopExportacao(venda.cfop) &&
  cstPermiteDebito(venda.pisCst) &&
  cstPermiteDebito(venda.cofinsCst);

export interface EFDData {
  cadastro: {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    municipio: string;
    periodoInicial: string;
    periodoFinal: string;
    periodoInicialDisplay: string;
    periodoFinalDisplay: string;
  };
  regime: {
    codigo: string;
    descricao: string;
    pisAliquota: number;
    cofinsAliquota: number;
  };
  produtos: Array<{
    codigo: string;
    descricao: string;
    ncm: string;
    unidade: string;
  }>;
  leiaute: LeiauteSped;
  vendas: Array<{
    data: string;
    documento: string;
    docChave: string;
    cfop: string;
    produto: string;
    ncm: string;
    quantidade: number;
    valor: number;
    pisCst: string;
    pisBase: number;
    pisAliquota: number;
    pisValor: number;
    cofinsCst: string;
    cofinsBase: number;
    cofinsAliquota: number;
    cofinsValor: number;
  }>;
  compras: Array<{
    data: string;
    fornecedor: string;
    cfop: string;
    produto: string;
    valor: number;
    pisValor: number;
    cofinsValor: number;
  }>;
  apuracaoPIS: {
    receitas: Record<string, number>;
    creditos: Record<string, number>;
    totalReceitas: number;
    totalCreditos: number;
    saldoDevedor: number;
  };
  apuracaoCOFINS: {
    receitas: Record<string, number>;
    creditos: Record<string, number>;
    totalReceitas: number;
    totalCreditos: number;
    saldoDevedor: number;
  };
  resumo: {
    totalVendas: number;
    totalCompras: number;
    totalPIS: number;
    totalCOFINS: number;
    totalICMS: number;
    totalIPI: number;
    pisDevido: number;
    pisInformado: number;
    pisDiferenca: number;
    cofinsDevido: number;
    cofinsInformado: number;
    cofinsDiferenca: number;
  };
  receitaDocumental: {
    blocoA: number;
    blocoC: number;
    blocoD: number;
    blocoF: number;
    total: number;
    detalhamento: Array<{
      bloco: string;
      registro: string;
      documento: string;
      valor: number;
      cfop?: string;
      tipoDoc?: string;
    }>;
  };
  receitaApurada: {
    pisM210: number;
    cofinsM610: number;
    total: number;
  };
  riscoFiscal: ResumoRiscoFiscal;
  /** Metadados dos arquivos de origem da análise (evidência de upload) */
  fontes?: {
    arquivos: string[];
    quantidade: number;
  };
  /**
   * Apuração do bloco E para arquivos EFD ICMS/IPI (SPED Fiscal).
   * Presente apenas quando `leiaute === 'efd-icms-ipi'` — as telas seguem as
   * mesmas abas de Contribuições, com a leitura/análise feita no parser.
   */
  icmsIpi?: EFDIcmsIpiData;
}

export interface AlertaFiscal {
  id: string;
  grupo: 'G1' | 'G2' | 'G3' | 'G4';
  tipo: string;
  severidade: 'alta' | 'media' | 'baixa';
  mensagem: string;
  detalhes: {
    produto?: string;
    ncm?: string;
    documento?: string;
    cfop?: string;
    baseCalculo?: number;
    aliquotaAplicada?: number;
    aliquotaEsperada?: number;
    valorLancado?: number;
    valorEsperado?: number;
    diferenca?: number;
    impacto?: number;
    acaoSugerida?: string;
  };
}

const parseDecimal = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
};

const parseDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 8) return '';
  // Datas no EFD são DDMMYYYY (ex.: 15062026 = 15/06/2026)
  return `${dateStr.substring(0, 2)}/${dateStr.substring(2, 4)}/${dateStr.substring(4, 8)}`;
};

const formatDateExtended = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 8) return '';
  
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const dia = dateStr.substring(0, 2);
  const mes = parseInt(dateStr.substring(2, 4), 10);
  const ano = dateStr.substring(4, 8);
  
  return `${dia} de ${meses[mes - 1]} de ${ano}`;
};

export const parseEFD = (content: string): EFDData => {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  
  const data: EFDData = {
    leiaute: detectarLeiaute(content),
    cadastro: {
      cnpj: '',
      razaoSocial: '',
      uf: '',
      municipio: '',
      periodoInicial: '',
      periodoFinal: '',
      periodoInicialDisplay: '',
      periodoFinalDisplay: '',
    },
    regime: {
      codigo: '',
      descricao: '',
      pisAliquota: 0,
      cofinsAliquota: 0,
    },
    produtos: [],
    vendas: [],
    compras: [],
    apuracaoPIS: {
      receitas: {},
      creditos: {},
      totalReceitas: 0,
      totalCreditos: 0,
      saldoDevedor: 0,
    },
    apuracaoCOFINS: {
      receitas: {},
      creditos: {},
      totalReceitas: 0,
      totalCreditos: 0,
      saldoDevedor: 0,
    },
    resumo: {
      totalVendas: 0,
      totalCompras: 0,
      totalPIS: 0,
      totalCOFINS: 0,
    totalICMS: 0,
    totalIPI: 0,
    pisDevido: 0,
    pisInformado: 0,
    pisDiferenca: 0,
    cofinsDevido: 0,
    cofinsInformado: 0,
    cofinsDiferenca: 0,
    },
    receitaDocumental: {
      blocoA: 0,
      blocoC: 0,
      blocoD: 0,
      blocoF: 0,
      total: 0,
      detalhamento: [],
    },
    receitaApurada: {
      pisM210: 0,
      cofinsM610: 0,
      total: 0,
    },
    riscoFiscal: {
      totalPrincipal: 0,
      totalMulta: 0,
      totalJurosEstimado: 0,
      totalGeral: 0,
      itens: [],
    },
  };

  // Maps auxiliares
  const produtosMap = new Map<string, EFDData['produtos'][number]>();
  const documentosC100 = new Map<string, { data: string; numero: string; valor: number }>();
  const c100ValoresPorNumero = new Map<string, number>();
  const documentosA100 = new Map<string, { chave: string; numero: string; data: string; valor: number; indOper: string }>();
  const documentosD100 = new Map<string, { chave: string; numero: string; data: string; valor: number; indOper: string }>();
  const documentosF100 = new Map<string, { chave: string; data: string; valor: number; indOper: string; cstPis: string }>();
  const comprasPorChave = new Map<string, EFDData['compras'][number]>();
  let documentoAtual = '';
  const documentosProcessados = new Set<string>(); // Para evitar duplicação

  lines.forEach(line => {
    // CRÍTICO: NÃO remover campos vazios - SPED tem | no início
    const campos = line.split('|');
    const registro = campos[1]; // Registro começa em campos[1]

    switch (registro) {
      case '0000': {
        // Layout oficial SPED: |0000|COD_VER|COD_FIN|DT_INI|DT_FIN|NOME|CNPJ|CPF|UF|IE|COD_MUN|IM|SUFRAMA|IND_PERFIL|IND_ATIV
        // Detecta a posição de DT_INI (primeiro campo com 8 dígitos após COD_FIN)
        // para suportar o layout oficial e variações de arquivos/mocks.
        let dtIniIdx = -1;
        for (let i = 4; i < campos.length && i < 12; i++) {
          if (/^\d{8}$/.test(campos[i] || '')) { dtIniIdx = i; break; }
        }
        if (dtIniIdx >= 0) {
          data.cadastro.periodoInicial = campos[dtIniIdx] || '';
          data.cadastro.periodoFinal = campos[dtIniIdx + 1] || '';
          data.cadastro.periodoInicialDisplay = formatDateExtended(campos[dtIniIdx]);
          data.cadastro.periodoFinalDisplay = formatDateExtended(campos[dtIniIdx + 1]);
          data.cadastro.razaoSocial = campos[dtIniIdx + 2] || '';
          data.cadastro.cnpj = campos[dtIniIdx + 3] || '';
          for (let i = dtIniIdx + 4; i < campos.length && i < dtIniIdx + 8; i++) {
            if (/^[A-Z]{2}$/.test(campos[i] || '')) { data.cadastro.uf = campos[i]; break; }
          }
          for (let i = dtIniIdx + 5; i < campos.length && i < dtIniIdx + 10; i++) {
            if (/^\d{7}$/.test(campos[i] || '')) { data.cadastro.municipio = campos[i]; break; }
          }
        }
        break;
      }

      case '0110': {
        data.regime.codigo = campos[2] || '';
        const codigoRegime = parseInt(campos[2] || '0');
        if (codigoRegime === 1) {
          data.regime.descricao = 'Não Cumulativo';
          data.regime.pisAliquota = 1.65;
          data.regime.cofinsAliquota = 7.6;
        } else if (codigoRegime === 2) {
          data.regime.descricao = 'Cumulativo';
          data.regime.pisAliquota = 0.65;
          data.regime.cofinsAliquota = 3.0;
        } else if (codigoRegime === 3) {
          data.regime.descricao = 'Misto';
          data.regime.pisAliquota = 1.65;
          data.regime.cofinsAliquota = 7.6;
        }
        break;
      }

      case '0200': {
        // Layout oficial 0200: COD_ITEM=2, DESCR_ITEM=3, COD_BARRA=4, COD_UNID=5,
        // TIPO_ITEM=6, COD_NCM=7, EX_IPI=8, COD_LST=9, ALIQ_ICMS=10, ...
        const ncm0200 =
          [campos[7], campos[8], campos[9]].find(c => /^\d{8}$/.test(c || '')) || '';
        const produto = {
          codigo: campos[2] || '',
          descricao: campos[3] || '',
          unidade: (campos[6] || campos[5] || '').trim(),
          ncm: ncm0200,
        };
        produtosMap.set(produto.codigo, produto);
        data.produtos.push(produto);
        break;
      }

      case 'C100': {
        // Layout oficial C100: IND_OPER=2, IND_EMIT=3, COD_PART=4, COD_MOD=5,
        // COD_SIT=6, SER=7, NUM_DOC=8, CHV_NFE=9, DT_DOC=10, DT_E_S=11, VL_DOC=12
        const indOperC = campos[2] || '';
        const numeroDocC = campos[8] || '';
        const valorDocC = parseDecimal(campos[12]);
        // Documento em papel (modelos 01, 04 e 1B) não tem chave: sem identidade
        // composta os itens do C170 seriam descartados.
        documentoAtual = campos[9] || `C100-${indOperC}-${campos[4]}-${campos[5]}-${campos[7]}-${numeroDocC}`;
        documentosC100.set(documentoAtual, {
          data: parseDate(campos[10]),
          numero: numeroDocC,
          valor: valorDocC,
        });
        // Só saída alimenta receita; a chave composta impede que uma nota de
        // entrada de mesmo número sobrescreva o valor de uma de saída.
        if (indOperC === '1') {
          c100ValoresPorNumero.set(documentoAtual, valorDocC);
        }
        break;
      }

      case 'C170':
        if (documentoAtual) {
          const doc = documentosC100.get(documentoAtual);
          const prodCodigo = campos[3] || '';
          const prod = produtosMap.get(prodCodigo);
          
          // Layout oficial C170 (mantendo campos vazios):
          // Campo 30 = VL_PIS (valor do PIS)
          // Campo 36 = VL_COFINS (valor do COFINS)
          const pisValorExtraido = parseDecimal(campos[30]);
          const cofinsValorExtraido = parseDecimal(campos[36]);
          
          const venda = {
            data: doc?.data || '',
            documento: doc?.numero || '',
            docChave: documentoAtual,
            cfop: campos[11] || '',
            produto: prod?.descricao || prodCodigo,
            ncm: prod?.ncm || '',
            quantidade: parseDecimal(campos[5]),
            valor: parseDecimal(campos[7]),
            pisCst: campos[25] || '',
            pisBase: parseDecimal(campos[26]),
            pisAliquota: parseDecimal(campos[27]),
            pisValor: pisValorExtraido,
            cofinsCst: campos[31] || '',
            cofinsBase: parseDecimal(campos[32]),
            cofinsAliquota: parseDecimal(campos[33]),
            cofinsValor: cofinsValorExtraido,
          };
          
          data.vendas.push(venda);
          if (isCfopSaida(venda.cfop)) {
            data.resumo.totalVendas += venda.valor;
            data.resumo.totalPIS += venda.pisValor;
            data.resumo.totalCOFINS += venda.cofinsValor;
          }
        }
        break;

      case 'C191': {
        // Layout oficial C191: CNPJ_CPF_PART=2, CST_PIS=3, CFOP=4, VL_ITEM=5,
        // VL_DESC=6, VL_BC_PIS=7, ALIQ_PIS=8, QUANT_BC_PIS=9, ALIQ_PIS_QUANT=10, VL_PIS=11
        const compra = {
          data: '',
          fornecedor: campos[2] || '',
          cfop: campos[4] || '',
          produto: '',
          valor: parseDecimal(campos[5]),
          pisValor: parseDecimal(campos[11]),
          cofinsValor: 0,
        };
        data.compras.push(compra);
        comprasPorChave.set(`${compra.fornecedor}|${compra.cfop}|${campos[5]}`, compra);
        data.resumo.totalCompras += compra.valor;
        break;
      }

      case 'C195': {
        // O C195 da EFD-Contribuições espelha o C191 para a COFINS (VL_COFINS=11).
        // No EFD ICMS/IPI o mesmo código é "Observações do Lançamento Fiscal", com
        // outro leiaute — a checagem de forma evita corromper o dado nesse caso.
        if (campos.length < 12 || !/^\d{4}$/.test(campos[4] || '')) break;
        const alvo = comprasPorChave.get(`${campos[2] || ''}|${campos[4] || ''}|${campos[5]}`);
        if (alvo) alvo.cofinsValor = parseDecimal(campos[11]);
        break;
      }

      case 'M100': {
        // Layout oficial M100: COD_CRED=2, IND_CRED_ORI=3, VL_BC_PIS=4, ALIQ_PIS=5,
        // QUANT_BC_PIS=6, ALIQ_PIS_QUANT=7, VL_CRED=8. É crédito, não receita.
        const codCredPIS = campos[2] || '';
        const creditoPIS = parseDecimal(campos[8]);
        data.apuracaoPIS.creditos[codCredPIS] = (data.apuracaoPIS.creditos[codCredPIS] ?? 0) + creditoPIS;
        data.apuracaoPIS.totalCreditos += creditoPIS;
        break;
      }

      case 'M200':
        // VL_CONT_CUM_REC=12 é só a parcela cumulativa; o total é VL_TOT_CONT_REC=13
        data.apuracaoPIS.saldoDevedor = parseDecimal(campos[13]);
        break;

      case 'M210': {
        // Layout oficial M210: COD_CONT=2, VL_REC_BRT=3. O registro se repete por
        // código de contribuição — atribuir em vez de somar perde as demais linhas.
        const codContPIS = campos[2] || '';
        const receitaPIS = parseDecimal(campos[3]);
        data.apuracaoPIS.receitas[codContPIS] = (data.apuracaoPIS.receitas[codContPIS] ?? 0) + receitaPIS;
        data.apuracaoPIS.totalReceitas += receitaPIS;
        data.receitaApurada.pisM210 += receitaPIS;
        break;
      }

      case 'M500': {
        // Layout oficial M500: COD_CRED=2, IND_CRED_ORI=3, ..., VL_CRED=8
        const codCredCOFINS = campos[2] || '';
        const creditoCOFINS = parseDecimal(campos[8]);
        data.apuracaoCOFINS.creditos[codCredCOFINS] = (data.apuracaoCOFINS.creditos[codCredCOFINS] ?? 0) + creditoCOFINS;
        data.apuracaoCOFINS.totalCreditos += creditoCOFINS;
        break;
      }

      case 'M600':
        // VL_CONT_CUM_REC=12 é só a parcela cumulativa; o total é VL_TOT_CONT_REC=13
        data.apuracaoCOFINS.saldoDevedor = parseDecimal(campos[13]);
        break;

      case 'M610': {
        // Layout oficial M610: COD_CONT=2, VL_REC_BRT=3 (repete por código de contribuição)
        const codContCOFINS = campos[2] || '';
        const receitaCOFINS = parseDecimal(campos[3]);
        data.apuracaoCOFINS.receitas[codContCOFINS] = (data.apuracaoCOFINS.receitas[codContCOFINS] ?? 0) + receitaCOFINS;
        data.apuracaoCOFINS.totalReceitas += receitaCOFINS;
        data.receitaApurada.cofinsM610 += receitaCOFINS;
        break;
      }

      case 'A100': {
        // Layout oficial A100: IND_OPER=2, IND_EMIT=3, COD_PART=4, COD_SIT=5, SER=6,
        // SUB=7, NUM_DOC=8, CHV_NFSE=9, DT_DOC=10, DT_EXE_SERV=11, VL_DOC=12.
        // IND_OPER: 0 = serviço contratado (despesa), 1 = serviço prestado (receita).
        const numeroA100 = campos[8] || '';
        const docA100Chave = campos[9] || `A100-${campos[6]}-${campos[7]}-${numeroA100}`;
        const indOperA = campos[2] || '';
        const valorA100 = parseDecimal(campos[12]);

        documentosA100.set(docA100Chave, {
          chave: docA100Chave,
          numero: numeroA100,
          data: parseDate(campos[10]),
          valor: valorA100,
          indOper: indOperA,
        });
        
        // Se IND_OPER = 1 (saída), considerar na receita
        if (indOperA === '1' && valorA100 > 0) {
          data.receitaDocumental.blocoA += valorA100;
          data.receitaDocumental.detalhamento.push({
            bloco: 'A',
            registro: 'A100',
            documento: docA100Chave,
            valor: valorA100,
          });
        }
        
        documentoAtual = docA100Chave;
        break;
      }

      case 'A170':
        // Itens do documento de serviços
        // Layout: REG|NUM_ITEM|COD_ITEM|DESCR_COMPL|VL_ITEM|VL_DESC|NAT_BC_CRED|IND_ORIG_CRED|...
        if (documentoAtual && documentosA100.has(documentoAtual)) {
          const docA = documentosA100.get(documentoAtual);
          const valorA170 = parseDecimal(campos[5]);
          const itemCodigo = campos[3] || 'SERVIÇO';
          
          // A170 tem prioridade sobre A100 para detalhamento
          // Mas só se IND_OPER = 1 (saída)
          if (docA.indOper === '1' && valorA170 > 0 && !documentosProcessados.has(`${documentoAtual}-A170`)) {
            // Remove o valor A100 se já foi adicionado
            const indexA100 = data.receitaDocumental.detalhamento.findIndex(
              d => d.documento === documentoAtual && d.registro === 'A100'
            );
            if (indexA100 >= 0) {
              data.receitaDocumental.blocoA -= docA.valor;
              data.receitaDocumental.detalhamento.splice(indexA100, 1);
            }
            
            data.receitaDocumental.blocoA += valorA170;
            data.receitaDocumental.detalhamento.push({
              bloco: 'A',
              registro: 'A170',
              documento: `${documentoAtual}-${itemCodigo}`,
              valor: valorA170,
            });
            
            documentosProcessados.add(`${documentoAtual}-A170`);
          }
        }
        break;

      case 'D100': {
        // Layout oficial D100: IND_OPER=2, IND_EMIT=3, COD_PART=4, COD_MOD=5, COD_SIT=6,
        // SER=7, SUB=8, NUM_DOC=9, CHV_CTE=10, DT_DOC=11, DT_A_P=12, TP_CTE=13,
        // CHV_CTE_REF=14, VL_DOC=15
        const numeroD100 = campos[9] || '';
        const docD100Chave = campos[10] || `D100-${campos[5]}-${campos[7]}-${campos[8]}-${numeroD100}`;
        const indOperD = campos[2] || '';
        const valorD100 = parseDecimal(campos[15]);

        documentosD100.set(docD100Chave, {
          chave: docD100Chave,
          numero: numeroD100,
          data: parseDate(campos[11]),
          valor: valorD100,
          indOper: indOperD,
        });
        
        // Se IND_OPER = 1 (saída/prestação de serviço), considerar na receita
        if (indOperD === '1' && valorD100 > 0) {
          data.receitaDocumental.blocoD += valorD100;
          data.receitaDocumental.detalhamento.push({
            bloco: 'D',
            registro: 'D100',
            documento: docD100Chave,
            valor: valorD100,
          });
        }
        
        documentoAtual = docD100Chave;
        break;
      }

      case 'D500': {
        // Layout oficial D500: IND_OPER=2, IND_EMIT=3, COD_PART=4, COD_MOD=5, COD_SIT=6,
        // SER=7, SUB=8, NUM_DOC=9, DT_DOC=10, DT_A_P=11, VL_DOC=12
        const numeroD500 = campos[9] || '';
        const docD500Chave = `D500-${campos[5]}-${campos[7]}-${campos[8]}-${numeroD500}`;
        const indOperD500 = campos[2] || '';
        const valorD500 = parseDecimal(campos[12]);

        documentosD100.set(docD500Chave, {
          chave: docD500Chave,
          numero: numeroD500,
          data: parseDate(campos[10]),
          valor: valorD500,
          indOper: indOperD500,
        });
        
        // Se IND_OPER = 1 (saída/prestação de serviço), considerar na receita
        if (indOperD500 === '1' && valorD500 > 0) {
          data.receitaDocumental.blocoD += valorD500;
          data.receitaDocumental.detalhamento.push({
            bloco: 'D',
            registro: 'D500',
            documento: docD500Chave,
            valor: valorD500,
          });
        }
        break;
      }

      case 'F100': {
        // Layout oficial F100: IND_OPER=2, COD_PART=3, COD_ITEM=4, DT_OPER=5, VL_OPER=6,
        // CST_PIS=7, ..., NAT_BC_CRED=15, IND_ORIG_CRED=16. O registro não tem campo de
        // modelo de documento — quem decide a receita aqui é o IND_OPER
        // (0 = aquisição, 1 = operação geradora de receita, 2 = outras).
        const indOperF = campos[2] || '';
        const valorF100 = parseDecimal(campos[6]);
        const cstPisF = campos[7] || '';
        const docF100Chave = `F100-${campos[3]}-${campos[4]}-${campos[5]}-${campos[6]}`;

        documentosF100.set(docF100Chave, {
          chave: docF100Chave,
          data: parseDate(campos[5]),
          valor: valorF100,
          indOper: indOperF,
          cstPis: cstPisF,
        });

        if (indOperF === '1' && valorF100 > 0) {
          data.receitaDocumental.blocoF += valorF100;
          data.receitaDocumental.detalhamento.push({
            bloco: 'F',
            registro: 'F100',
            documento: docF100Chave,
            valor: valorF100,
          });
        }
        
        documentoAtual = docF100Chave;
        break;
      }

      case 'F120':
        // Bens Incorporados ao Ativo Imobilizado - Operações Geradoras de Créditos
        // Layout: REG|NAT_BC_CRED|IDENT_BEM_IMOB|IND_ORIG_CRED|IND_UTIL_BEM_IMOB|VL_OPER_DEP|...
        // F120 geralmente não gera receita, apenas créditos
        // Não incluir na receita documental
        break;
    }
  });

  // Aplicar regras de CFOP nas vendas do Bloco C
  // Usa o VL_DOC do C100 (autoridade) uma única vez por documento de saída,
  // evitando a soma parcial dos itens do C170 e o viés de entradas tratadas como receita.
  const documentosReceitaC = new Set<string>();
  data.vendas.forEach(venda => {
    if (!isCfopSaida(venda.cfop)) return;
    const classification = classifyCfop(venda.cfop);
    if (!classification.gera_receita) return;
    const chaveDoc = venda.docChave;
    if (documentosReceitaC.has(chaveDoc)) return;
    documentosReceitaC.add(chaveDoc);

    const valorDoc = c100ValoresPorNumero.get(chaveDoc) ?? 0;
    if (valorDoc <= 0) return;

    data.receitaDocumental.blocoC += valorDoc;
    data.receitaDocumental.detalhamento.push({
      bloco: 'C',
      registro: 'C100',
      documento: venda.documento,
      valor: valorDoc,
      cfop: venda.cfop,
    });
  });

  // Calcular total da receita documental
  data.receitaDocumental.total = 
    data.receitaDocumental.blocoA +
    data.receitaDocumental.blocoC +
    data.receitaDocumental.blocoD +
    data.receitaDocumental.blocoF;

  // Calcular total da receita apurada (média entre PIS e COFINS)
  data.receitaApurada.total = 
    (data.receitaApurada.pisM210 + data.receitaApurada.cofinsM610) / 2;

  // Calcula PIS/COFINS com prioridade: NCM → Registro → Regime
  // Apenas operações de SAÍDA com incidência (CST de débito) entram na apuração
  // de "informado/devido". Entradas e CST sem incidência geram só crédito/análise.
  const itensRisco: RiscoFiscalItem[] = [];
  
  data.vendas.forEach(venda => {
    if (!apuraDebitoPisCofins(venda)) {
      return;
    }

    // Acumula PIS/COFINS informados (arredonda 2 casas)
    const pisInf = Math.round(venda.pisValor * 100) / 100;
    const cofinsInf = Math.round(venda.cofinsValor * 100) / 100;
    
    data.resumo.pisInformado += pisInf;
    data.resumo.cofinsInformado += cofinsInf;
    
    // Busca alíquota NCM (prioridade 1)
    const aliquotaNCM = buscarAliquotaNCM(venda.ncm, venda.data);
    
    let aliqPIS = data.regime.pisAliquota; // fallback regime
    let aliqCOFINS = data.regime.cofinsAliquota;
    let fonte = data.regime.descricao;
    
    if (aliquotaNCM) {
      // Prioridade 1: tabela NCM
      aliqPIS = aliquotaNCM.aliquotaPIS;
      aliqCOFINS = aliquotaNCM.aliquotaCOFINS;
      fonte = `${aliquotaNCM.obs} - ${aliquotaNCM.descricao}`;
    } else if (venda.pisAliquota > 0 || venda.cofinsAliquota > 0) {
      // Prioridade 2: registro C170
      if (venda.pisAliquota > 0) aliqPIS = venda.pisAliquota;
      if (venda.cofinsAliquota > 0) aliqCOFINS = venda.cofinsAliquota;
      fonte = 'Registro C170';
    }
    
    // Calcula devidos (arredonda 2 casas)
    const pisDevido = Math.round((venda.valor * aliqPIS) / 100 * 100) / 100;
    const cofinsDevido = Math.round((venda.valor * aliqCOFINS) / 100 * 100) / 100;
    
    // Acumula devidos
    data.resumo.pisDevido += pisDevido;
    data.resumo.cofinsDevido += cofinsDevido;
    
    // Calcula diferenças (arredonda 2 casas)
    const pisDif = Math.round(Math.max(0, pisDevido - pisInf) * 100) / 100;
    const cofinsDif = Math.round(Math.max(0, cofinsDevido - cofinsInf) * 100) / 100;
    
    // Só adiciona ao risco fiscal se houver NCM na tabela E houver diferença
    if (aliquotaNCM && (pisDif > 0.01 || cofinsDif > 0.01)) {
      const itemRisco = calcularRiscoFiscalItem({
        produto: venda.produto,
        ncm: venda.ncm,
        documento: venda.documento,
        dataOperacao: venda.data,
        baseCalculo: venda.valor,
        pisInformado: pisInf,
        pisAliquotaInformada: venda.pisAliquota,
        pisAliquotaDevida: aliqPIS,
        cofinsInformado: cofinsInf,
        cofinsAliquotaInformada: venda.cofinsAliquota,
        cofinsAliquotaDevida: aliqCOFINS,
        fonte,
      });
      
      itensRisco.push(itemRisco);
    }
  });
  
  // Arredonda totais para 2 casas
  data.resumo.pisDevido = Math.round(data.resumo.pisDevido * 100) / 100;
  data.resumo.cofinsDevido = Math.round(data.resumo.cofinsDevido * 100) / 100;
  data.resumo.pisInformado = Math.round(data.resumo.pisInformado * 100) / 100;
  data.resumo.cofinsInformado = Math.round(data.resumo.cofinsInformado * 100) / 100;
  
  // Calcula diferenças totais (arredonda 2 casas)
  data.resumo.pisDiferenca = Math.round(Math.max(0, data.resumo.pisDevido - data.resumo.pisInformado) * 100) / 100;
  data.resumo.cofinsDiferenca = Math.round(Math.max(0, data.resumo.cofinsDevido - data.resumo.cofinsInformado) * 100) / 100;
  
  // Consolida risco fiscal
  data.riscoFiscal = consolidarRiscoFiscal(itensRisco);

  // EFD ICMS/IPI: anexa a apuração do bloco E (E100/E110/..., E500/E520/...).
  // O front segue as mesmas abas de Contribuições; só a leitura muda.
  if (data.leiaute === 'efd-icms-ipi') {
    const icmsIpi = parseEFDIcmsIpi(content);
    data.icmsIpi = icmsIpi;
    data.resumo.totalICMS = icmsIpi.resumo.icmsRecolher;
    data.resumo.totalIPI = icmsIpi.resumo.ipiSaldo;
  }

  return data;
};

export const analisarAlertas = (data: EFDData): AlertaFiscal[] => {
  // EFD ICMS/IPI tem apuração própria (bloco E): os alertas de PIS/COFINS e de
  // reconciliação M210/M610 não se aplicam — a leitura é feita no parser do ICMS/IPI.
  if (data.leiaute === 'efd-icms-ipi') {
    return analisarAlertasIcmsIpi(data);
  }

  const alertas: AlertaFiscal[] = [];
  let alertaId = 1;

  // G1: Divergências de PIS/COFINS
  data.vendas.forEach(venda => {
    if (!apuraDebitoPisCofins(venda)) return;

    // Busca alíquota na tabela NCM
    const aliquotaNCM = buscarAliquotaNCM(venda.ncm, venda.data);
    
    let aliqPISEsperada = data.regime.pisAliquota;
    let aliqCOFINSEsperada = data.regime.cofinsAliquota;
    let fonte = data.regime.descricao;
    
    if (aliquotaNCM) {
      aliqPISEsperada = aliquotaNCM.aliquotaPIS;
      aliqCOFINSEsperada = aliquotaNCM.aliquotaCOFINS;
      fonte = `${aliquotaNCM.obs} - ${aliquotaNCM.descricao}`;
    } else if (venda.pisAliquota > 0 || venda.cofinsAliquota > 0) {
      // Sem alíquota oficial para o NCM não há como afirmar que a do arquivo está
      // errada. Usar o regime aqui acusava toda venda cumulativa de empresa mista.
      if (venda.pisAliquota > 0) aliqPISEsperada = venda.pisAliquota;
      if (venda.cofinsAliquota > 0) aliqCOFINSEsperada = venda.cofinsAliquota;
      fonte = 'Registro C170';
    }

    // Verifica divergência PIS
    const valorPISEsperado = (venda.pisBase * aliqPISEsperada) / 100;
    const divPIS = Math.abs(valorPISEsperado - venda.pisValor);
    
    if (divPIS > 0.5) {
      alertas.push({
        id: `G1-${alertaId++}`,
        grupo: 'G1',
        tipo: 'Divergência PIS',
        severidade: divPIS > 10 ? 'alta' : divPIS > 2 ? 'media' : 'baixa',
        mensagem: `Alíquota de PIS aplicada incorretamente`,
        detalhes: {
          produto: venda.produto,
          ncm: venda.ncm,
          documento: venda.documento,
          cfop: venda.cfop,
          baseCalculo: venda.pisBase,
          aliquotaAplicada: venda.pisAliquota,
          aliquotaEsperada: aliqPISEsperada,
          valorLancado: venda.pisValor,
          valorEsperado: valorPISEsperado,
          diferenca: divPIS,
          impacto: divPIS,
          acaoSugerida: `Ajustar regras para NCM ${venda.ncm}, aplicar ${aliqPISEsperada}% (${fonte})`,
        },
      });
    }

    // Verifica divergência COFINS
    const valorCOFINSEsperado = (venda.cofinsBase * aliqCOFINSEsperada) / 100;
    const divCOFINS = Math.abs(valorCOFINSEsperado - venda.cofinsValor);
    
    if (divCOFINS > 0.5) {
      alertas.push({
        id: `G1-${alertaId++}`,
        grupo: 'G1',
        tipo: 'Divergência COFINS',
        severidade: divCOFINS > 10 ? 'alta' : divCOFINS > 2 ? 'media' : 'baixa',
        mensagem: `Alíquota de COFINS aplicada incorretamente`,
        detalhes: {
          produto: venda.produto,
          ncm: venda.ncm,
          documento: venda.documento,
          cfop: venda.cfop,
          baseCalculo: venda.cofinsBase,
          aliquotaAplicada: venda.cofinsAliquota,
          aliquotaEsperada: aliqCOFINSEsperada,
          valorLancado: venda.cofinsValor,
          valorEsperado: valorCOFINSEsperado,
          diferenca: divCOFINS,
          impacto: divCOFINS,
          acaoSugerida: `Ajustar regras para NCM ${venda.ncm}, aplicar ${aliqCOFINSEsperada}% (${fonte})`,
        },
      });
    }
  });

  // G3: Reconciliação M×Docs (Receita Apurada vs Receita Documental)
  const receitaDocumental = data.receitaDocumental.total;
  const receitaApuradaPIS = data.receitaApurada.pisM210;
  const receitaApuradaCOFINS = data.receitaApurada.cofinsM610;
  const receitaApuradaMedia = data.receitaApurada.total;
  
  const difReconciliacaoPIS = Math.abs(receitaDocumental - receitaApuradaPIS);
  const difReconciliacaoCOFINS = Math.abs(receitaDocumental - receitaApuradaCOFINS);
  const difReconciliacaoMedia = Math.abs(receitaDocumental - receitaApuradaMedia);

  // Alerta para divergência no PIS
  if (difReconciliacaoPIS > 100 && receitaApuradaPIS > 0) {
    const percentualDiv = ((difReconciliacaoPIS / receitaApuradaPIS) * 100).toFixed(2);
    alertas.push({
      id: `G3-${alertaId++}`,
      grupo: 'G3',
      tipo: 'Reconciliação M210×Docs',
      severidade: difReconciliacaoPIS > 10000 ? 'alta' : difReconciliacaoPIS > 1000 ? 'media' : 'baixa',
      mensagem: `Divergência entre receita apurada (M210/PIS) e documentos fiscais (${percentualDiv}%)`,
      detalhes: {
        valorLancado: receitaApuradaPIS,
        valorEsperado: receitaDocumental,
        diferenca: difReconciliacaoPIS,
        impacto: difReconciliacaoPIS,
        acaoSugerida: `Revisar documentos fiscais nos blocos A (R$ ${data.receitaDocumental.blocoA.toFixed(2)}), C (R$ ${data.receitaDocumental.blocoC.toFixed(2)}), D (R$ ${data.receitaDocumental.blocoD.toFixed(2)}), F (R$ ${data.receitaDocumental.blocoF.toFixed(2)}) e registro M210`,
      },
    });
  }

  // Alerta para divergência no COFINS
  if (difReconciliacaoCOFINS > 100 && receitaApuradaCOFINS > 0) {
    const percentualDiv = ((difReconciliacaoCOFINS / receitaApuradaCOFINS) * 100).toFixed(2);
    alertas.push({
      id: `G3-${alertaId++}`,
      grupo: 'G3',
      tipo: 'Reconciliação M610×Docs',
      severidade: difReconciliacaoCOFINS > 10000 ? 'alta' : difReconciliacaoCOFINS > 1000 ? 'media' : 'baixa',
      mensagem: `Divergência entre receita apurada (M610/COFINS) e documentos fiscais (${percentualDiv}%)`,
      detalhes: {
        valorLancado: receitaApuradaCOFINS,
        valorEsperado: receitaDocumental,
        diferenca: difReconciliacaoCOFINS,
        impacto: difReconciliacaoCOFINS,
        acaoSugerida: `Revisar documentos fiscais nos blocos A (R$ ${data.receitaDocumental.blocoA.toFixed(2)}), C (R$ ${data.receitaDocumental.blocoC.toFixed(2)}), D (R$ ${data.receitaDocumental.blocoD.toFixed(2)}), F (R$ ${data.receitaDocumental.blocoF.toFixed(2)}) e registro M610`,
      },
    });
  }

  // Alerta geral de reconciliação
  if (difReconciliacaoMedia > 100 && receitaApuradaMedia > 0) {
    const percentualDiv = receitaApuradaMedia > 0 ? ((difReconciliacaoMedia / receitaApuradaMedia) * 100).toFixed(2) : '0.00';
    alertas.push({
      id: `G3-${alertaId++}`,
      grupo: 'G3',
      tipo: 'Reconciliação Geral M×Docs',
      severidade: difReconciliacaoMedia > 10000 ? 'alta' : difReconciliacaoMedia > 1000 ? 'media' : 'baixa',
      mensagem: `Divergência na reconciliação entre apuração (M210/M610) e documentos fiscais (${percentualDiv}%)`,
      detalhes: {
        valorLancado: receitaApuradaMedia,
        valorEsperado: receitaDocumental,
        diferenca: difReconciliacaoMedia,
        impacto: difReconciliacaoMedia,
        acaoSugerida: `Reconciliação completa: Bloco A (${data.receitaDocumental.blocoA.toFixed(2)}), Bloco C (${data.receitaDocumental.blocoC.toFixed(2)}), Bloco D (${data.receitaDocumental.blocoD.toFixed(2)}), Bloco F (${data.receitaDocumental.blocoF.toFixed(2)}). Total Documentos: ${receitaDocumental.toFixed(2)} vs M210: ${receitaApuradaPIS.toFixed(2)} / M610: ${receitaApuradaCOFINS.toFixed(2)}`,
      },
    });
  }

  return alertas;
};

/**
 * Alertas para EFD ICMS/IPI: conferências de fechamento do bloco E
 * (E110 do ICMS e E520/E510 do IPI) além de obrigações a recolher (E116).
 */
const analisarAlertasIcmsIpi = (data: EFDData): AlertaFiscal[] => {
  const alertas: AlertaFiscal[] = [];
  let alertaId = 1;
  const icmsIpi = data.icmsIpi || parseEFDIcmsIpi('');
  const icms = icmsIpi.apuracaoIcms;
  const ipi = icmsIpi.apuracaoIpi;

  const severidadePorDif = (diferenca: number): AlertaFiscal['severidade'] =>
    diferenca > 10000 ? 'alta' : diferenca > 1000 ? 'media' : 'baixa';

  const TIPO_POR_CONFERENCIA: Record<ConferenciaDeFechamento['id'], string> = {
    'icms-e110': 'Fechamento ICMS (E110)',
    'ipi-e520': 'Fechamento IPI (E520)',
    'ipi-e510-x-e520': 'Consolidação IPI (E510×E520)',
  };

  // Registros essenciais do bloco E ausentes
  if (!icms.e110) {
    alertas.push({
      id: `G3-${alertaId++}`,
      grupo: 'G3',
      tipo: 'Ausência de apuração ICMS',
      severidade: 'media',
      mensagem: 'Bloco E sem apuração de ICMS (E100/E110) no período',
      detalhes: {
        impacto: 0,
        acaoSugerida: 'Confirmar se a empresa está sujeita à apuração mensal de ICMS no período ou se o arquivo está incompleto.',
      },
    });
  }

  if (!ipi.e520) {
    alertas.push({
      id: `G3-${alertaId++}`,
      grupo: 'G3',
      tipo: 'Ausência de apuração IPI',
      severidade: 'media',
      mensagem: 'Bloco E sem apuração de IPI (E500/E520) no período',
      detalhes: {
        impacto: 0,
        acaoSugerida: 'Confirmar se a empresa é contribuinte do IPI no período; caso positivo, o arquivo pode estar incompleto.',
      },
    });
  }

  // Obrigações a recolher informadas no E116
  if (icms.e116.length > 0) {
    const totalObrigacoes = icms.e116.reduce((sum, o) => sum + o.valor, 0);
    alertas.push({
      id: `G3-${alertaId++}`,
      grupo: 'G3',
      tipo: 'Obrigações a recolher (E116)',
      severidade: totalObrigacoes > 10000 ? 'media' : 'baixa',
      mensagem: `${icms.e116.length} obrigação(ões) a recolher no período (E116)`,
      detalhes: {
        valorEsperado: totalObrigacoes,
        impacto: totalObrigacoes,
        acaoSugerida: 'Conferir se as obrigações do E116 constam nas guias de recolhimento (GNRE/DARE).',
      },
    });
  }

  icmsIpi.conferencias.forEach(conferencia => {
    if (conferencia.fechou) return;
    const diferenca = conferencia.diferenca;
    alertas.push({
      id: `G1-${alertaId++}`,
      grupo: 'G1',
      tipo: TIPO_POR_CONFERENCIA[conferencia.id],
      severidade: severidadePorDif(diferenca),
      mensagem: `${conferencia.titulo} — não fecha por ${formatMoedaEst(diferenca)}`,
      detalhes: {
        baseCalculo: undefined,
        valorLancado: undefined,
        valorEsperado: undefined,
        diferenca,
        impacto: diferenca,
        acaoSugerida: `Revisar os registros do bloco E (${conferencia.detalhes}). Diferença estimada de ${formatMoedaEst(diferenca)}.`,
      },
    });
  });

  return alertas;
};

const formatMoedaEst = (v: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export interface ColunaResumo {
  titulo: string;
  sub: string;
  valor: number;
}

export interface GrupoResumo {
  emoji: string;
  titulo: string;
  subtitulo: string;
  col1: ColunaResumo;
  col2: ColunaResumo;
  col3: ColunaResumo;
}

/**
 * Estrutura que alimenta os cards de "Resumo dos riscos identificados".
 * Um único layout; apenas os números e rótulos mudam conforme o leiaute —
 * Contribuições (PIS/COFINS) ou ICMS/IPI (apuração do bloco E).
 */
export interface ResumoRiscosDashboard {
  modo: LeiauteSped;
  receitaTitulo: string;
  receita: number;
  receitaSub: string;
  grupoA: GrupoResumo;
  grupoB: GrupoResumo;
  totaisTitulo: string;
  principal: { valor: number; sub: string };
  multa: { valor: number; sub: string };
  total: { valor: number; sub: string };
  notas: string[];
}

const difConferencia = (data: EFDData, id: ConferenciaDeFechamento['id']): number =>
  data.icmsIpi?.conferencias.find(c => c.id === id)?.diferenca ?? 0;

export const montarResumoRiscos = (data: EFDData): ResumoRiscosDashboard => {
  if (data.leiaute === 'efd-icms-ipi') {
    const icms = data.icmsIpi;
    const icmsApurado = icms ? Math.max(0, icms.apuracaoIcms.e110?.saldoRecalculado ?? 0) : 0;
    const icmsRecolher = icms?.resumo.icmsRecolher ?? 0;
    const icmsDif = difConferencia(data, 'icms-e110');

    const ipiApurado = icms ? Math.max(0, icms.apuracaoIpi.e520?.saldoRecalculado ?? 0) : 0;
    const ipiDeclarado = icms ? Math.abs(icms.apuracaoIpi.e520?.saldoDeclarado ?? 0) : 0;
    const ipiDif = difConferencia(data, 'ipi-e520');

    const conferenciasDivergentes = icms?.conferencias.filter(c => !c.fechou) ?? [];
    const principal = conferenciasDivergentes.reduce((sum, c) => sum + c.diferenca, 0);
    const multa = Math.round(principal * 0.2 * 100) / 100;

    return {
      modo: 'efd-icms-ipi',
      receitaTitulo: 'Receita Base',
      receita: data.resumo.totalVendas,
      receitaSub: 'Vendas do período (Bloco C)',
      grupoA: {
        emoji: '📊',
        titulo: 'ICMS',
        subtitulo: 'ICMS — Apuração do período',
        col1: { titulo: 'ICMS Apurado', sub: 'Débitos − Créditos (E110)', valor: icmsApurado },
        col2: { titulo: 'ICMS a Recolher', sub: 'Declarado no E110', valor: icmsRecolher },
        col3: { titulo: 'Divergência de Fechamento', sub: 'Recalculado × Declarado', valor: icmsDif },
      },
      grupoB: {
        emoji: '📈',
        titulo: 'IPI',
        subtitulo: 'IPI — Apuração do período',
        col1: { titulo: 'Saldo Apurado', sub: 'Débitos − Créditos (E520)', valor: ipiApurado },
        col2: { titulo: 'Saldo Declarado', sub: 'Informado no E520', valor: ipiDeclarado },
        col3: { titulo: 'Divergência de Fechamento', sub: 'Recalculado × Declarado', valor: ipiDif },
      },
      totaisTitulo: 'Valores a Complementar',
      principal: { valor: principal, sub: 'Somatório das divergências de fechamento' },
      multa: { valor: multa, sub: '20% do principal (est.)' },
      total: { valor: Math.round(principal * 1.2 * 100) / 100, sub: 'Principal + Multa' },
      notas: [
        'ICMS Apurado = débitos − créditos do E110 (com estornos e saldo anterior)',
        'IPI = saldo do E520 (saldo anterior + débitos + outros débitos − créditos − outros créditos)',
        'Divergências de fechamento estimadas quando o recalculado difere do declarado (tolerância R$ 0,02)',
        'Multa de mora estimada em 20% conforme Lei 9.430/96 (sujeita a validação)',
        'FECP, CIAP e ressarcimento de saldo credor (ICMS) dependem da legislação do estado',
      ],
    };
  }

  return {
    modo: data.leiaute,
    receitaTitulo: 'Receita Base',
    receita: data.resumo.totalVendas,
    receitaSub: 'Base de cálculo para PIS/COFINS',
    grupoA: {
      emoji: '📊',
      titulo: 'PIS',
      subtitulo: 'PIS (Alíquota 2,10%)',
      col1: { titulo: 'PIS Devido', sub: '2,10% da receita', valor: data.resumo.pisDevido },
      col2: { titulo: 'PIS Informado', sub: 'Declarado no EFD', valor: data.resumo.pisInformado },
      col3: { titulo: 'PIS Diferença', sub: 'Devido - Informado', valor: data.resumo.pisDiferenca },
    },
    grupoB: {
      emoji: '📈',
      titulo: 'COFINS',
      subtitulo: 'COFINS (Alíquota 9,90%)',
      col1: { titulo: 'COFINS Devido', sub: '9,90% da receita', valor: data.resumo.cofinsDevido },
      col2: { titulo: 'COFINS Informado', sub: 'Declarado no EFD', valor: data.resumo.cofinsInformado },
      col3: { titulo: 'COFINS Diferença', sub: 'Devido - Informado', valor: data.resumo.cofinsDiferenca },
    },
    totaisTitulo: 'Valores a Complementar',
    principal: { valor: data.riscoFiscal.totalPrincipal, sub: 'PIS Dif. + COFINS Dif.' },
    multa: { valor: data.riscoFiscal.totalMulta, sub: '20% do principal' },
    total: { valor: data.riscoFiscal.totalGeral, sub: 'Principal + Multa' },
    notas: [
      'PIS Devido calculado com alíquota de 2,10% (tabela NCM)',
      'COFINS Devido calculado com alíquota de 9,90% (tabela NCM)',
      'Multa de mora aplicada conforme Lei 9.430/96 (limitada a 20%)',
      'Valores devem ser complementados junto à Receita Federal',
    ],
  };
};
