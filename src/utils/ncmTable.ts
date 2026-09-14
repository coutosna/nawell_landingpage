/**
 * Tabela de NCM com alíquotas diferenciadas de PIS/COFINS
 * Baseado na Lei 10.147/2000 e legislações correlatas
 */

export interface NCMAliquota {
  ncmInicio: string;
  ncmFim: string;
  descricao: string;
  aliquotaPIS: number; // Em percentual (ex: 2.1 para 2,1%)
  aliquotaCOFINS: number; // Em percentual (ex: 9.9 para 9,9%)
  incidencia: 'SAIDA' | 'ENTRADA';
  vigenciaInicio: string;
  vigenciaFim?: string;
  obs: string;
}

export const TABELA_NCM: NCMAliquota[] = [
  {
    ncmInicio: '30010000',
    ncmFim: '30019999',
    descricao: 'Produtos farmacêuticos',
    aliquotaPIS: 2.1,
    aliquotaCOFINS: 9.9,
    incidencia: 'SAIDA',
    vigenciaInicio: '2009-01-01',
    obs: 'Lei 10.147/2000'
  },
  {
    ncmInicio: '30030000',
    ncmFim: '30039999',
    descricao: 'Produtos farmacêuticos',
    aliquotaPIS: 2.1,
    aliquotaCOFINS: 9.9,
    incidencia: 'SAIDA',
    vigenciaInicio: '2009-01-01',
    obs: 'Lei 10.147/2000'
  },
  {
    ncmInicio: '30040000',
    ncmFim: '30049999',
    descricao: 'Produtos farmacêuticos',
    aliquotaPIS: 2.1,
    aliquotaCOFINS: 9.9,
    incidencia: 'SAIDA',
    vigenciaInicio: '2009-01-01',
    obs: 'Lei 10.147/2000'
  },
  {
    ncmInicio: '33030000',
    ncmFim: '33059999',
    descricao: 'Perfumaria/Toucador/Higiene',
    aliquotaPIS: 2.2,
    aliquotaCOFINS: 10.3,
    incidencia: 'SAIDA',
    vigenciaInicio: '2015-05-01',
    obs: 'Lei 10.147/2000'
  },
  {
    ncmInicio: '33070000',
    ncmFim: '33079999',
    descricao: 'Perfumaria/Toucador/Higiene',
    aliquotaPIS: 2.2,
    aliquotaCOFINS: 10.3,
    incidencia: 'SAIDA',
    vigenciaInicio: '2015-05-01',
    obs: 'Lei 10.147/2000'
  }
];

/**
 * Busca a alíquota aplicável para um NCM específico
 * @param ncm - Código NCM do produto (8 dígitos)
 * @param data - Data da operação (opcional, para verificar vigência)
 * @returns Objeto com as alíquotas ou null se não encontrado
 */
export const buscarAliquotaNCM = (
  ncm: string, 
  data?: string
): NCMAliquota | null => {
  if (!ncm || ncm.length < 8) return null;
  
  // Normaliza o NCM para 8 dígitos
  const ncmNormalizado = ncm.padEnd(8, '0');
  
  // Busca na tabela
  const resultado = TABELA_NCM.find(item => {
    const ncmNumerico = parseInt(ncmNormalizado);
    const inicioNumerico = parseInt(item.ncmInicio);
    const fimNumerico = parseInt(item.ncmFim);
    
    return ncmNumerico >= inicioNumerico && ncmNumerico <= fimNumerico;
  });
  
  // TODO: Validar vigência quando a data for fornecida
  
  return resultado || null;
};
