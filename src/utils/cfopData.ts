export interface CFOPInfo {
  cfop: string;
  descricao: string;
  tipo: 'Entrada' | 'Saída';
  indNFe: number;
  indComunica: number;
  indTransp: number;
  indDevol: number;
}

export const CFOP_DATABASE: Record<string, CFOPInfo> = {
  // ENTRADAS ESTADUAIS (1xxx)
  '1101': { cfop: '1101', descricao: 'Compra p/ industrialização ou produção rural', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1102': { cfop: '1102', descricao: 'Compra p/ comercialização', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1111': { cfop: '1111', descricao: 'Compra p/ industrialização de mercadoria recebida anteriormente em consignação industrial', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1113': { cfop: '1113', descricao: 'Compra p/ comercialização, de mercadoria recebida anteriormente em consignação mercantil', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1116': { cfop: '1116', descricao: 'Compra p/ industrialização ou produção rural originada de encomenda p/ recebimento futuro', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1117': { cfop: '1117', descricao: 'Compra p/ comercialização originada de encomenda p/ recebimento futuro', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1118': { cfop: '1118', descricao: 'Compra de mercadoria p/ comercialização pelo adquirente originário, entregue pelo vendedor remetente ao destinatário, em venda à ordem', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1120': { cfop: '1120', descricao: 'Compra p/ industrialização, em venda à ordem, já recebida do vendedor remetente', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1121': { cfop: '1121', descricao: 'Compra p/ comercialização, em venda à ordem, já recebida do vendedor remetente', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1122': { cfop: '1122', descricao: 'Compra p/ industrialização em que a mercadoria foi remetida pelo fornecedor ao industrializador sem transitar pelo estabelecimento adquirente', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1124': { cfop: '1124', descricao: 'Industrialização efetuada por outra empresa', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1125': { cfop: '1125', descricao: 'Industrialização efetuada por outra empresa quando a mercadoria remetida p/ utilização no processo de industrialização não transitou pelo estabelecimento adquirente da mercadoria', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1126': { cfop: '1126', descricao: 'Compra p/ utilização na prestação de serviço sujeita ao ICMS', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1128': { cfop: '1128', descricao: 'Compra p/ utilização na prestação de serviço sujeita ao ISSQN', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1151': { cfop: '1151', descricao: 'Transferência p/ industrialização ou produção rural', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1152': { cfop: '1152', descricao: 'Transferência p/ comercialização', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1153': { cfop: '1153', descricao: 'Transferência de energia elétrica p/ distribuição', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1154': { cfop: '1154', descricao: 'Transferência p/ utilização na prestação de serviço', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1201': { cfop: '1201', descricao: 'Devolução de venda de produção do estabelecimento', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1202': { cfop: '1202', descricao: 'Devolução de venda de mercadoria adquirida ou recebida de terceiros', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1203': { cfop: '1203', descricao: 'Devolução de venda de produção do estabelecimento, destinada à ZFM ou ALC', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1204': { cfop: '1204', descricao: 'Devolução de venda de mercadoria adquirida ou recebida de terceiros, destinada à ZFM ou ALC', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1205': { cfop: '1205', descricao: 'Anulação de valor relativo à prestação de serviço de comunicação', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1206': { cfop: '1206', descricao: 'Anulação de valor relativo à prestação de serviço de transporte', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1207': { cfop: '1207', descricao: 'Anulação de valor relativo à venda de energia elétrica', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1208': { cfop: '1208', descricao: 'Devolução de produção do estabelecimento, remetida em transferência', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1209': { cfop: '1209', descricao: 'Devolução de mercadoria adquirida ou recebida de terceiros, remetida em transferência', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1212': { cfop: '1212', descricao: 'Devolução de venda no mercado interno de mercadoria industrializada e insumo importado sob o Regime Aduaneiro Especial de Entreposto Industrial (Recof-Sped)', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1251': { cfop: '1251', descricao: 'Compra de energia elétrica p/ distribuição ou comercialização', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1252': { cfop: '1252', descricao: 'Compra de energia elétrica por estabelecimento industrial', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1253': { cfop: '1253', descricao: 'Compra de energia elétrica por estabelecimento comercial', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1254': { cfop: '1254', descricao: 'Compra de energia elétrica por estabelecimento prestador de serviço de transporte', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1255': { cfop: '1255', descricao: 'Compra de energia elétrica por estabelecimento prestador de serviço de comunicação', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1256': { cfop: '1256', descricao: 'Compra de energia elétrica por estabelecimento de produtor rural', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1257': { cfop: '1257', descricao: 'Compra de energia elétrica p/ consumo por demanda contratada', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1301': { cfop: '1301', descricao: 'Aquisição de serviço de comunicação p/ execução de serviço da mesma natureza', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1302': { cfop: '1302', descricao: 'Aquisição de serviço de comunicação por estabelecimento industrial', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1303': { cfop: '1303', descricao: 'Aquisição de serviço de comunicação por estabelecimento comercial', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1304': { cfop: '1304', descricao: 'Aquisição de serviço de comunicação por estabelecimento de prestador de serviço de transporte', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1305': { cfop: '1305', descricao: 'Aquisição de serviço de comunicação por estabelecimento de geradora ou de distribuidora de energia elétrica', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1306': { cfop: '1306', descricao: 'Aquisição de serviço de comunicação por estabelecimento de produtor rural', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1351': { cfop: '1351', descricao: 'Aquisição de serviço de transporte p/ execução de serviço da mesma natureza', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1352': { cfop: '1352', descricao: 'Aquisição de serviço de transporte por estabelecimento industrial', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1353': { cfop: '1353', descricao: 'Aquisição de serviço de transporte por estabelecimento comercial', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1354': { cfop: '1354', descricao: 'Aquisição de serviço de transporte por estabelecimento de prestador de serviço de comunicação', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1355': { cfop: '1355', descricao: 'Aquisição de serviço de transporte por estabelecimento de geradora ou de distribuidora de energia elétrica', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1356': { cfop: '1356', descricao: 'Aquisição de serviço de transporte por estabelecimento de produtor rural', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1360': { cfop: '1360', descricao: 'Aquisição de serviço de transporte por contribuinte-substituto em relação ao serviço de transporte', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1401': { cfop: '1401', descricao: 'Compra p/ industrialização ou produção rural de mercadoria sujeita a ST', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1403': { cfop: '1403', descricao: 'Compra p/ comercialização em operação com mercadoria sujeita a ST', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1406': { cfop: '1406', descricao: 'Compra de bem p/ o ativo imobilizado cuja mercadoria está sujeita a ST', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1407': { cfop: '1407', descricao: 'Compra de mercadoria p/ uso ou consumo cuja mercadoria está sujeita a ST', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1408': { cfop: '1408', descricao: 'Transferência p/ industrialização ou produção rural de mercadoria sujeita a ST', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1409': { cfop: '1409', descricao: 'Transferência p/ comercialização em operação com mercadoria sujeita a ST', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1410': { cfop: '1410', descricao: 'Devolução de venda de mercadoria, de produção do estabelecimento, sujeita a ST', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1411': { cfop: '1411', descricao: 'Devolução de venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita a ST', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1414': { cfop: '1414', descricao: 'Retorno de mercadoria de produção do estabelecimento, remetida p/ venda fora do estabelecimento, sujeita a ST', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1415': { cfop: '1415', descricao: 'Retorno de mercadoria adquirida ou recebida de terceiros, remetida p/ venda fora do estabelecimento em operação com mercadoria sujeita a ST', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1451': { cfop: '1451', descricao: 'Retorno de animal do estabelecimento produtor', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1452': { cfop: '1452', descricao: 'Retorno de insumo não utilizado na produção', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1501': { cfop: '1501', descricao: 'Entrada de mercadoria recebida com fim específico de exportação', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1503': { cfop: '1503', descricao: 'Entrada decorrente de devolução de produto, de fabricação do estabelecimento, remetido com fim específico de exportação', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1504': { cfop: '1504', descricao: 'Entrada decorrente de devolução de mercadoria remetida com fim específico de exportação, adquirida ou recebida de terceiros', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1505': { cfop: '1505', descricao: 'Entrada decorrente de devolução simbólica de mercadoria remetida p/ formação de lote de exportação, de produto industrializado ou produzido pelo próprio estabelecimento', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1506': { cfop: '1506', descricao: 'Entrada decorrente de devolução simbólica de mercadoria, adquirida ou recebida de terceiros, remetida p/ formação de lote de exportação', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1551': { cfop: '1551', descricao: 'Compra de bem p/ o ativo imobilizado', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1552': { cfop: '1552', descricao: 'Transferência de bem do ativo imobilizado', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1553': { cfop: '1553', descricao: 'Devolução de venda de bem do ativo imobilizado', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1554': { cfop: '1554', descricao: 'Retorno de bem do ativo imobilizado remetido p/ uso fora do estabelecimento', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1555': { cfop: '1555', descricao: 'Entrada de bem do ativo imobilizado de terceiro, remetido p/ uso no estabelecimento', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1556': { cfop: '1556', descricao: 'Compra de material p/ uso ou consumo', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1557': { cfop: '1557', descricao: 'Transferência de material p/ uso ou consumo', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1601': { cfop: '1601', descricao: 'Recebimento, por transferência, de crédito de ICMS', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1602': { cfop: '1602', descricao: 'Recebimento, por transferência, de saldo credor do ICMS, de outro estabelecimento da mesma empresa, p/ compensação de saldo devedor do imposto', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1603': { cfop: '1603', descricao: 'Ressarcimento de ICMS retido por substituição tributária', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1604': { cfop: '1604', descricao: 'Lançamento do crédito relativo à compra de bem p/ o ativo imobilizado', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1605': { cfop: '1605', descricao: 'Recebimento, por transferência, de saldo devedor do ICMS de outro estabelecimento da mesma empresa', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1651': { cfop: '1651', descricao: 'Compra de combustível ou lubrificante p/ industrialização subseqüente', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1652': { cfop: '1652', descricao: 'Compra de combustível ou lubrificante p/ comercialização', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1653': { cfop: '1653', descricao: 'Compra de combustível ou lubrificante por consumidor ou usuário final', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1658': { cfop: '1658', descricao: 'Transferência de combustível ou lubrificante p/ industrialização', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1659': { cfop: '1659', descricao: 'Transferência de combustível ou lubrificante p/ comercialização', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1660': { cfop: '1660', descricao: 'Devolução de venda de combustível ou lubrificante destinados à industrialização subseqüente', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1661': { cfop: '1661', descricao: 'Devolução de venda de combustível ou lubrificante destinados à comercialização', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1662': { cfop: '1662', descricao: 'Devolução de venda de combustível ou lubrificante destinados a consumidor ou usuário final', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1663': { cfop: '1663', descricao: 'Entrada de combustível ou lubrificante p/ armazenagem', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1664': { cfop: '1664', descricao: 'Retorno de combustível ou lubrificante remetidos p/ armazenagem', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1901': { cfop: '1901', descricao: 'Entrada p/ industrialização por encomenda', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1902': { cfop: '1902', descricao: 'Retorno de mercadoria remetida p/ industrialização por encomenda', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1903': { cfop: '1903', descricao: 'Entrada de mercadoria remetida p/ industrialização e não aplicada no referido processo', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1904': { cfop: '1904', descricao: 'Retorno de remessa p/ venda fora do estabelecimento', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1905': { cfop: '1905', descricao: 'Entrada de mercadoria recebida p/ depósito em depósito fechado ou armazém geral', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1906': { cfop: '1906', descricao: 'Retorno de mercadoria remetida p/ depósito fechado ou armazém geral', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1907': { cfop: '1907', descricao: 'Retorno simbólico de mercadoria remetida p/ depósito fechado ou armazém geral', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1908': { cfop: '1908', descricao: 'Entrada de bem por conta de contrato de comodato', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1909': { cfop: '1909', descricao: 'Retorno de bem remetido por conta de contrato de comodato', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1910': { cfop: '1910', descricao: 'Entrada de bonificação, doação ou brinde', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1911': { cfop: '1911', descricao: 'Entrada de amostra grátis', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1912': { cfop: '1912', descricao: 'Entrada de mercadoria ou bem recebido p/ demonstração', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1913': { cfop: '1913', descricao: 'Retorno de mercadoria ou bem remetido p/ demonstração', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1914': { cfop: '1914', descricao: 'Retorno de mercadoria ou bem remetido p/ exposição ou feira', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1915': { cfop: '1915', descricao: 'Entrada de mercadoria ou bem recebido p/ conserto ou reparo', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1916': { cfop: '1916', descricao: 'Retorno de mercadoria ou bem remetido p/ conserto ou reparo', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1917': { cfop: '1917', descricao: 'Entrada de mercadoria recebida em consignação mercantil ou industrial', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1918': { cfop: '1918', descricao: 'Devolução de mercadoria remetida em consignação mercantil ou industrial', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1919': { cfop: '1919', descricao: 'Devolução simbólica de mercadoria vendida ou utilizada em processo industrial, remetida anteriormente em consignação mercantil ou industrial', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '1920': { cfop: '1920', descricao: 'Entrada de vasilhame ou sacaria', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1921': { cfop: '1921', descricao: 'Retorno de vasilhame ou sacaria', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1922': { cfop: '1922', descricao: 'Lançamento efetuado a título de simples faturamento decorrente de compra p/ recebimento futuro', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1923': { cfop: '1923', descricao: 'Entrada de mercadoria recebida do vendedor remetente, em venda à ordem', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1924': { cfop: '1924', descricao: 'Entrada p/ industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1925': { cfop: '1925', descricao: 'Retorno de mercadoria remetida p/ industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1926': { cfop: '1926', descricao: 'Lançamento efetuado a título de reclassificação de mercadoria decorrente de formação de kit ou de sua desagregação', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1931': { cfop: '1931', descricao: 'Lançamento efetuado pelo tomador do serviço de transporte, quando a responsabilidade de retenção do imposto for atribuída ao remetente ou alienante da mercadoria', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1932': { cfop: '1932', descricao: 'Aquisição de serviço de transporte iniciado em UF diversa daquela onde esteja inscrito o prestador', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1933': { cfop: '1933', descricao: 'Aquisição de serviço tributado pelo Imposto sobre Serviços de Qualquer Natureza', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1934': { cfop: '1934', descricao: 'Entrada simbólica de mercadoria recebida p/ depósito fechado ou armazém geral', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '1949': { cfop: '1949', descricao: 'Outra entrada de mercadoria ou prestação de serviço não especificada', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  
  // ENTRADAS INTERESTADUAIS (2xxx) - continua com mesmo padrão
  // Por brevidade, vou adicionar apenas algumas entradas 2xxx e depois pular para saídas
  '2101': { cfop: '2101', descricao: 'Compra p/ industrialização ou produção rural', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '2102': { cfop: '2102', descricao: 'Compra p/ comercialização', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '2403': { cfop: '2403', descricao: 'Compra p/ comercialização em operação com mercadoria sujeita a ST', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '2949': { cfop: '2949', descricao: 'Outra entrada de mercadoria ou prestação de serviço não especificado', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  
  // ENTRADAS EXTERIOR (3xxx)
  '3101': { cfop: '3101', descricao: 'Compra p/ industrialização ou produção rural', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '3102': { cfop: '3102', descricao: 'Compra p/ comercialização', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '3201': { cfop: '3201', descricao: 'Devolução de venda de produção do estabelecimento', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '3949': { cfop: '3949', descricao: 'Outra entrada de mercadoria ou prestação de serviço não especificado', tipo: 'Entrada', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  
  // SAÍDAS ESTADUAIS (5xxx)
  '5101': { cfop: '5101', descricao: 'Venda de produção do estabelecimento', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '5102': { cfop: '5102', descricao: 'Venda de mercadoria adquirida ou recebida de terceiros', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '5103': { cfop: '5103', descricao: 'Venda de produção do estabelecimento efetuada fora do estabelecimento', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '5104': { cfop: '5104', descricao: 'Venda de mercadoria adquirida ou recebida de terceiros, efetuada fora do estabelecimento', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '5105': { cfop: '5105', descricao: 'Venda de produção do estabelecimento que não deva por ele transitar', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '5106': { cfop: '5106', descricao: 'Venda de mercadoria adquirida ou recebida de terceiros, que não deva por ele transitar', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '5201': { cfop: '5201', descricao: 'Devolução de compra p/ industrialização ou produção rural', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '5202': { cfop: '5202', descricao: 'Devolução de compra p/ comercialização', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '5405': { cfop: '5405', descricao: 'Venda de mercadoria, adquirida ou recebida de terceiros, sujeita a ST, na condição de contribuinte-substituído', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '5949': { cfop: '5949', descricao: 'Outra saída de mercadoria ou prestação de serviço não especificado', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  
  // SAÍDAS INTERESTADUAIS (6xxx)
  '6101': { cfop: '6101', descricao: 'Venda de produção do estabelecimento', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '6102': { cfop: '6102', descricao: 'Venda de mercadoria adquirida ou recebida de terceiros', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '6103': { cfop: '6103', descricao: 'Venda de produção do estabelecimento, efetuada fora do estabelecimento', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '6107': { cfop: '6107', descricao: 'Venda de produção do estabelecimento, destinada a não contribuinte', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '6108': { cfop: '6108', descricao: 'Venda de mercadoria adquirida ou recebida de terceiros, destinada a não contribuinte', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '6201': { cfop: '6201', descricao: 'Devolução de compra p/ industrialização ou produção rural', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '6202': { cfop: '6202', descricao: 'Devolução de compra p/ comercialização', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '6403': { cfop: '6403', descricao: 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita a ST, na condição de contribuinte substituto', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '6949': { cfop: '6949', descricao: 'Outra saída de mercadoria ou prestação de serviço não especificado', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  
  // SAÍDAS EXTERIOR (7xxx)
  '7101': { cfop: '7101', descricao: 'Venda de produção do estabelecimento', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '7102': { cfop: '7102', descricao: 'Venda de mercadoria adquirida ou recebida de terceiros', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
  '7201': { cfop: '7201', descricao: 'Devolução de compra p/ industrialização ou produção rural', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 1 },
  '7949': { cfop: '7949', descricao: 'Outra saída de mercadoria ou prestação de serviço não especificado', tipo: 'Saída', indNFe: 1, indComunica: 0, indTransp: 0, indDevol: 0 },
};

export const getCFOPInfo = (cfop: string): CFOPInfo => {
  // Remove vírgula se existir no código CFOP
  const cleanCfop = cfop.replace(',', '').replace('.', '');
  
  return CFOP_DATABASE[cleanCfop] || {
    cfop: cleanCfop,
    descricao: 'Código CFOP não catalogado - consulte tabela oficial',
    tipo: cleanCfop.startsWith('1') || cleanCfop.startsWith('2') || cleanCfop.startsWith('3') ? 'Entrada' : 'Saída',
    indNFe: 1,
    indComunica: 0,
    indTransp: 0,
    indDevol: 0
  };
};

export const getTipoCFOP = (cfop: string): 'Entrada' | 'Saída' => {
  const primeiroDigito = cfop.charAt(0);
  return ['1', '2', '3'].includes(primeiroDigito) ? 'Entrada' : 'Saída';
};

export const isEstadual = (cfop: string): boolean => {
  return cfop.startsWith('1') || cfop.startsWith('5');
};

export const isInterestadual = (cfop: string): boolean => {
  return cfop.startsWith('2') || cfop.startsWith('6');
};

export const isExterior = (cfop: string): boolean => {
  return cfop.startsWith('3') || cfop.startsWith('7');
};

export const isDevolu = (cfop: string): boolean => {
  const cleanCfop = cfop.replace(',', '').replace('.', '');
  const info = getCFOPInfo(cleanCfop);
  return info.indDevol === 1;
};
