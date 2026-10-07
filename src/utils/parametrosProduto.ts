/**
 * Pisos de ruído definidos pelo produto, não pela legislação: abaixo deles a
 * divergência continua existindo, só não vira alerta.
 */
export const PARAMETROS_PRODUTO = {
  /** R24 — PIS mínimo para alertar entrada escriturada com CST de débito */
  pisMinimoEntradaComDebito: 100,
  /** R26 — divergência mínima entre receita documental e M210/M610 */
  divergenciaMinimaReconciliacao: 100,
};

export const ROTULO_PARAMETRO_PRODUTO = 'piso configurável do produto, não regra fiscal';
