import React from 'react';
import {
    MessageCircle, Clock, AlertTriangle, Car, Wrench, User, MapPin
} from 'lucide-react';
import { getTimeInCurrentStage, formatStageDuration } from '../utils/funnelActions';

/**
 * Card de uma oportunidade dentro do Kanban.
 * É arrastável via HTML5 drag-and-drop: grava o id no dataTransfer para que
 * o KanbanBoard consiga identificá-lo no `onDrop`.
 */
export default function KanbanCard({ opportunity, onDragStart, onQuickWhatsApp, onClick }) {
    const minutes = getTimeInCurrentStage(opportunity.funnelHistory);
    const isStalled = minutes > 1440; // > 24h parado
    const isOficina = opportunity.tipoCliente === 'Oficina';

    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', opportunity.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(e);
    };

    const firstName = (opportunity.clienteNome || 'Sem nome').trim().split(' ')[0];

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={() => onClick?.(opportunity)}
            className={`group bg-white rounded-xl border p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:-translate-y-0.5 ${isStalled ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'
                }`}
        >
            {/* Cabeçalho: nome + perfil */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isOficina ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {isOficina ? <Wrench size={13} /> : <User size={13} />}
                    </div>
                    <span className="font-bold text-sm text-slate-800 truncate" title={opportunity.clienteNome}>
                        {opportunity.clienteNome || 'Sem nome'}
                    </span>
                </div>
                {opportunity.clienteTelefone && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onQuickWhatsApp?.(opportunity); }}
                        className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg border border-emerald-100/60 shadow-sm transition-colors shrink-0"
                        title={`Enviar WhatsApp para ${firstName}`}
                    >
                        <MessageCircle size={15} />
                    </button>
                )}
            </div>

            {/* Peça e veículo */}
            <div className="space-y-1.5 mb-2.5">
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold truncate">
                        {opportunity.pecaProcurada || <span className="text-amber-500 italic">Peça não informada</span>}
                    </span>
                </div>
                {opportunity.veiculoModelo && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Car size={12} className="shrink-0" />
                        <span className="truncate">{opportunity.veiculoModelo}</span>
                    </div>
                )}
                {opportunity.clienteCidade && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{opportunity.clienteCidade}{opportunity.clienteUF ? ` - ${opportunity.clienteUF}` : ''}</span>
                    </div>
                )}
            </div>

            {/* Rodapé: tempo no estágio / valor */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className={`flex items-center gap-1 text-[11px] font-bold ${isStalled ? 'text-red-500' : 'text-slate-400'}`}>
                    {isStalled ? <AlertTriangle size={11} /> : <Clock size={11} />}
                    {formatStageDuration(minutes)}
                </div>
                {opportunity.houveVenda && opportunity.valorVenda && (
                    <span className="text-[11px] font-black text-emerald-600">
                        R$ {opportunity.valorVenda}
                    </span>
                )}
                {opportunity.origem && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[90px]" title={opportunity.origem}>
                        {opportunity.origem}
                    </span>
                )}
            </div>
        </div>
    );
}
