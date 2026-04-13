import React, { useState, useMemo } from 'react';
import { Sparkles, MessageCircle, Handshake, CheckCircle, XCircle, FileText, Filter, AlertTriangle } from 'lucide-react';
import KanbanCard from './KanbanCard';
import ActionSuggestion from './ActionSuggestion';
import { FUNNEL_STAGES } from '../utils/constants';
import { inferStage, getTimeInCurrentStage } from '../utils/funnelActions';

const STAGE_ICONS = {
    Sparkles: Sparkles,
    MessageCircle: MessageCircle,
    Handshake: Handshake,
    FileText: FileText,
    CheckCircle: CheckCircle,
    XCircle: XCircle,
};

export default function KanbanBoard({ opportunities, onStageChange, onQuickWhatsApp, onEditLead }) {
    const [dragOverStage, setDragOverStage] = useState(null);
    const [actionModal, setActionModal] = useState(null); // { opportunity, targetStage }
    const [showClosed, setShowClosed] = useState(false);

    // Group opportunities by stage
    const groupedLeads = useMemo(() => {
        const groups = {};
        FUNNEL_STAGES.forEach(s => { groups[s.id] = []; });

        opportunities.forEach(opp => {
            const stage = inferStage(opp);
            if (groups[stage]) groups[stage].push(opp);
        });

        // Sort within each stage: urgent (stalled) first, then by time desc
        Object.keys(groups).forEach(stageId => {
            groups[stageId].sort((a, b) => {
                const timeA = getTimeInCurrentStage(a.funnelHistory);
                const timeB = getTimeInCurrentStage(b.funnelHistory);
                return timeB - timeA; // Longest wait first
            });
        });

        return groups;
    }, [opportunities]);

    const visibleStages = showClosed
        ? FUNNEL_STAGES
        : FUNNEL_STAGES.filter(s => !s.id.startsWith('fechado'));

    const handleDrop = (e, targetStageId) => {
        e.preventDefault();
        setDragOverStage(null);

        const oppId = e.dataTransfer.getData('text/plain');
        const opp = opportunities.find(o => o.id === oppId);
        if (!opp) return;

        const currentStage = inferStage(opp);
        if (currentStage === targetStageId) return;

        // For closed stages without action, skip action suggestion
        if (targetStageId === 'fechado_perdido') {
            onStageChange?.(oppId, targetStageId, false);
            return;
        }

        // Show action suggestion modal for active stages
        setActionModal({ opportunity: opp, targetStage: targetStageId });
    };

    const handleDragOver = (e, stageId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverStage(stageId);
    };

    const handleDragLeave = () => {
        setDragOverStage(null);
    };

    const handleActionConfirm = (actionTaken) => {
        if (actionModal) {
            onStageChange?.(actionModal.opportunity.id, actionModal.targetStage, actionTaken);
        }
        setActionModal(null);
    };

    const handleActionSkip = () => {
        if (actionModal) {
            onStageChange?.(actionModal.opportunity.id, actionModal.targetStage, false);
        }
        setActionModal(null);
    };

    // Count stalled leads (>24h in active stages)
    const stalledCount = useMemo(() => {
        return opportunities.filter(opp => {
            const stage = inferStage(opp);
            if (stage.startsWith('fechado')) return false;
            const time = getTimeInCurrentStage(opp.funnelHistory);
            return time > 1440;
        }).length;
    }, [opportunities]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
                            <Filter size={18} />
                        </div>
                        Pipeline de Vendas
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Arraste os cards para avançar leads no funil
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {stalledCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 text-xs font-bold animate-pulse">
                            <AlertTriangle size={13} />
                            {stalledCount} parado{stalledCount > 1 ? 's' : ''}
                        </div>
                    )}

                    <button
                        onClick={() => setShowClosed(!showClosed)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showClosed
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                            }`}
                    >
                        {showClosed ? 'Ocultar Fechados' : 'Ver Fechados'}
                    </button>
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ minHeight: '65vh' }}>
                {visibleStages.map((stage) => {
                    const IconComp = STAGE_ICONS[stage.icon] || Sparkles;
                    const leads = groupedLeads[stage.id] || [];
                    const isDragOver = dragOverStage === stage.id;

                    return (
                        <div
                            key={stage.id}
                            onDrop={(e) => handleDrop(e, stage.id)}
                            onDragOver={(e) => handleDragOver(e, stage.id)}
                            onDragLeave={handleDragLeave}
                            className={`flex-shrink-0 w-72 snap-start rounded-2xl border-2 transition-all duration-200 flex flex-col ${isDragOver
                                    ? 'border-blue-400 bg-blue-50/50 shadow-xl shadow-blue-100 scale-[1.01]'
                                    : 'border-slate-200 bg-slate-50/80'
                                }`}
                        >
                            {/* Column Header */}
                            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200/60">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="p-1.5 rounded-lg"
                                        style={{ backgroundColor: stage.color + '20' }}
                                    >
                                        <IconComp size={15} style={{ color: stage.color }} />
                                    </div>
                                    <span className="font-bold text-sm text-slate-700">{stage.label}</span>
                                </div>
                                <span
                                    className="text-xs font-black px-2.5 py-1 rounded-full"
                                    style={{
                                        backgroundColor: stage.color + '15',
                                        color: stage.color,
                                    }}
                                >
                                    {leads.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[200px]">
                                {leads.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-xs text-slate-400 font-medium">
                                        Arraste leads aqui
                                    </div>
                                ) : (
                                    leads.map((opp) => (
                                        <KanbanCard
                                            key={opp.id}
                                            opportunity={opp}
                                            onDragStart={() => { }}
                                            onQuickWhatsApp={onQuickWhatsApp}
                                            onClick={onEditLead}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Action Suggestion Modal */}
            {actionModal && (
                <ActionSuggestion
                    opportunity={actionModal.opportunity}
                    targetStage={actionModal.targetStage}
                    onConfirm={handleActionConfirm}
                    onSkip={handleActionSkip}
                    onClose={() => setActionModal(null)}
                />
            )}
        </div>
    );
}
