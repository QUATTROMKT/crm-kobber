/**
 * Funnel Actions — lógica central do pipeline de vendas.
 *
 * Responsável por:
 *  - registrar eventos de movimentação no funil (funnelHistory);
 *  - inferir o estágio atual de uma oportunidade (inclusive registros antigos
 *    que só possuem o campo legado `houveVenda`);
 *  - calcular há quanto tempo um lead está parado no estágio atual;
 *  - formatar a mensagem de WhatsApp sugerida para cada estágio.
 *
 * IMPORTANTE: os eventos do funil são gravados dentro de um array no Firestore
 * (`arrayUnion`). O Firestore NÃO aceita `serverTimestamp()` dentro de arrays,
 * por isso usamos um timestamp do cliente (`Date.now()`, em milissegundos).
 */

import { STAGE_ACTIONS } from './constants';

/**
 * Cria um evento de transição de estágio para o histórico do funil.
 * @param {string|null} fromStage  estágio de origem (null quando é o 1º evento)
 * @param {string} toStage         estágio de destino
 * @param {string} userEmail       e-mail do vendedor que executou a ação
 * @param {boolean} actionTaken    se uma ação (ex: WhatsApp) foi disparada
 * @returns {object} evento serializável para o Firestore
 */
export const createFunnelEvent = (fromStage, toStage, userEmail, actionTaken = false) => ({
  from: fromStage ?? null,
  to: toStage,
  by: userEmail || 'desconhecido',
  action: !!actionTaken,
  at: Date.now(),
});

/**
 * Descobre o estágio atual de uma oportunidade.
 * Prioriza o campo `estagio`; cai para o campo legado `houveVenda` quando o
 * registro foi criado antes do pipeline existir.
 */
export const inferStage = (opp) => {
  if (!opp) return 'novo';
  if (opp.estagio) return opp.estagio;
  if (opp.houveVenda === true) return 'fechado_ganho';
  if (opp.houveVenda === false) return 'fechado_perdido';
  return 'novo';
};

/**
 * Tempo (em MINUTOS) desde a última movimentação no funil.
 * Usado para ordenar os cards (mais parados primeiro) e sinalizar leads
 * estagnados (> 1440 min = 24h).
 */
export const getTimeInCurrentStage = (funnelHistory) => {
  if (!Array.isArray(funnelHistory) || funnelHistory.length === 0) return 0;
  const last = funnelHistory[funnelHistory.length - 1];
  const at = last && typeof last.at === 'number' ? last.at : null;
  if (!at) return 0;
  return Math.max(0, Math.floor((Date.now() - at) / 60000));
};

/**
 * Formata um tempo em minutos para um rótulo curto e legível.
 * Ex.: 5 -> "5min", 90 -> "1h", 2880 -> "2d".
 */
export const formatStageDuration = (minutes) => {
  if (!minutes || minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

/**
 * Monta a mensagem de WhatsApp sugerida para um estágio, preenchendo as
 * variáveis {nome} e {peca}. Retorna '' quando não há template (o chamador
 * usa esse vazio como gatilho de fallback).
 */
export const formatStageMessage = (stageId, opp) => {
  const action = STAGE_ACTIONS[stageId];
  if (!action || !action.template || !opp) return '';
  const nome = (opp.clienteNome || '').trim().split(' ')[0] || 'tudo bem';
  const peca = (opp.pecaProcurada || '').trim() || 'sua peça';
  return action.template
    .replace(/{nome}/g, nome)
    .replace(/{peca}/g, peca);
};
