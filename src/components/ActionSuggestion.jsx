import React from 'react';
import { X, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { FUNNEL_STAGES, STAGE_ACTIONS } from '../utils/constants';
import { formatStageMessage } from '../utils/funnelActions';

/**
 * Modal de ação sugerida ao mover um lead para um novo estágio.
 * Oferece enviar a mensagem de WhatsApp recomendada (e marcar a ação como
 * executada) ou apenas avançar o lead sem contato.
 *
 * Props:
 *  - opportunity: lead sendo movido
 *  - targetStage: id do estágio de destino
 *  - onConfirm(actionTaken: boolean): confirma a movimentação
 *  - onSkip(): avança sem registrar ação
 *  - onClose(): fecha o modal sem mover
 */
export default function ActionSuggestion({ opportunity, targetStage, onConfirm, onSkip, onClose }) {
    const stage = FUNNEL_STAGES.find((s) => s.id === targetStage);
    const action = STAGE_ACTIONS[targetStage];
    const message = formatStageMessage(targetStage, opportunity);
    const firstName = (opportunity.clienteNome || '').trim().split(' ')[0] || 'cliente';

    const handleSendWhatsApp = () => {
        const raw = (opportunity.clienteTelefone || '').replace(/\D/g, '');
        if (message && raw.length >= 10) {
            const phone = raw.length <= 11 ? `55${raw}` : raw;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        }
        onConfirm?.(true);
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho */}
                <div
                    className="px-6 py-5 text-white relative"
                    style={{ background: `linear-gradient(135deg, ${stage?.color || '#4f46e5'}, #1e1b4b)` }}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition-colors"
                        title="Fechar"
                    >
                        <X size={16} />
                    </button>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/80 mb-1">
                        <ArrowRight size={13} />
                        Avançar para
                    </div>
                    <h3 className="text-2xl font-black leading-tight">{stage?.label || targetStage}</h3>
                    <p className="text-sm text-white/80 mt-1">{firstName} · {opportunity.pecaProcurada || 'peça não informada'}</p>
                </div>

                {/* Corpo */}
                <div className="p-6">
                    {action?.msg && (
                        <div className="flex items-start gap-2 mb-4">
                            <div className="bg-indigo-100 p-1.5 rounded-lg shrink-0">
                                <Sparkles size={15} className="text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Ação sugerida</p>
                                <p className="text-sm font-semibold text-slate-700">{action.msg}</p>
                            </div>
                        </div>
                    )}

                    {message && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                <MessageCircle size={12} /> Mensagem pronta
                            </p>
                            <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{message}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2.5">
                        {message && opportunity.clienteTelefone && (
                            <button
                                onClick={handleSendWhatsApp}
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={18} />
                                Enviar WhatsApp e avançar
                            </button>
                        )}
                        <button
                            onClick={() => onSkip?.()}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            Apenas avançar
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
