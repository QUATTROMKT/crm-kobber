import React, { useState, useMemo } from 'react';
import {
    Search, List, Store, Globe, Download,
    MessageCircle, Edit2, FileText, Trash2
} from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (value) => {
    if (typeof value === 'number') return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (!value) return "R$ 0,00";
    return `R$ ${value}`;
};

export default function LeadList({
    allOpportunities,
    handleEdit,
    handleDelete,
    handleGeneratePDF,
    handleWhatsApp,
    handleExportCSV
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');

    const filteredOpportunities = useMemo(() => {
        let data = allOpportunities;

        if (sourceFilter === 'online') {
            data = data.filter(opp =>
                opp.origem?.includes("Meta") ||
                opp.origem?.includes("Google") ||
                opp.origem?.includes("Site") ||
                opp.origem?.includes("WhatsApp") ||
                opp.vendedorEmail === 'sistema@kobber.com.br' ||
                opp.canalVenda === 'Online'
            );
        } else if (sourceFilter === 'manual') {
            data = data.filter(opp =>
                !opp.origem?.includes("Meta") &&
                !opp.origem?.includes("Google") &&
                !opp.origem?.includes("Site") &&
                !opp.origem?.includes("WhatsApp") &&
                opp.vendedorEmail !== 'sistema@kobber.com.br' &&
                opp.canalVenda !== 'Online'
            );
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(opp =>
                (opp.clienteNome && opp.clienteNome.toLowerCase().includes(lowerTerm)) ||
                (opp.pecaProcurada && opp.pecaProcurada.toLowerCase().includes(lowerTerm)) ||
                (opp.veiculoModelo && opp.veiculoModelo.toLowerCase().includes(lowerTerm))
            );
        }
        return data;
    }, [allOpportunities, searchTerm, sourceFilter]);

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-slate-100">
            <div className="p-6 bg-slate-50/50 border-b border-slate-200 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-800">Gerenciamento de Oportunidades</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Visualizando: {sourceFilter === 'all' ? 'Todos os Leads' : sourceFilter === 'online' ? 'Leads Online (Tráfego)' : 'Atendimento Balcão'}
                        </p>
                    </div>
                    <button
                        onClick={() => handleExportCSV(filteredOpportunities, sourceFilter)}
                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={18} />
                        <span>Exportar CSV</span>
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex bg-slate-200/60 p-1.5 rounded-xl">
                        <button
                            onClick={() => setSourceFilter('all')}
                            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${sourceFilter === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            <List size={16} /> Todos
                        </button>
                        <button
                            onClick={() => setSourceFilter('manual')}
                            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${sourceFilter === 'manual' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            <Store size={16} /> Balcão
                        </button>
                        <button
                            onClick={() => setSourceFilter('online')}
                            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${sourceFilter === 'online' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            <Globe size={16} /> Online
                        </button>
                    </div>

                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Pesquisar por cliente, peça ou veículo..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 text-slate-500 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200/80">
                        <tr>
                            <th className="p-5 w-32">Data/Hora</th>
                            <th className="p-5">Cliente / Interesse</th>
                            <th className="p-5 w-40 text-center">Origem</th>
                            <th className="p-5 w-36 text-center">Status</th>
                            <th className="p-5 text-right w-40">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOpportunities.map(opp => (
                            <tr key={opp.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="p-5 whitespace-nowrap text-slate-500 font-medium">
                                    {opp.createdAt ? (
                                        <>
                                            <div className="text-slate-700 font-bold">{new Date(opp.createdAt.seconds * 1000).toLocaleDateString()}</div>
                                            <div className="text-xs">{new Date(opp.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </>
                                    ) : '-'}
                                </td>
                                <td className="p-5">
                                    <div className="font-extrabold text-slate-800 text-base mb-1 flex items-center gap-2">
                                        {opp.clienteNome}
                                        {opp.clienteTelefone && (
                                            <button
                                                onClick={() => handleWhatsApp(opp)}
                                                className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-md transition-colors shadow-sm border border-emerald-100/50 opacity-0 group-hover:opacity-100 lg:opacity-100"
                                                title="Abrir WhatsApp"
                                            >
                                                <MessageCircle size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                            {opp.pecaProcurada || <span className='text-amber-500 italic'>Não preenchido</span>}
                                        </span>
                                        {opp.veiculoModelo && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span>{opp.veiculoModelo}</span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="p-5 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${opp.origem?.includes("Meta") || opp.origem?.includes("Site")
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : opp.origem?.includes("WhatsApp")
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                        {opp.origem || 'Balcão/Loja'}
                                    </span>
                                </td>
                                <td className="p-5 text-center">
                                    {opp.houveVenda ? (
                                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm flex flex-col items-center">
                                            <span className="uppercase tracking-wider">Vendido</span>
                                            <span className="font-medium text-[10px] bg-emerald-100/50 px-1 mt-0.5 rounded text-emerald-800">{formatCurrency(opp.valorVenda)}</span>
                                        </div>
                                    ) : (
                                        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm flex flex-col items-center">
                                            <span className="uppercase tracking-wider">Perdido</span>
                                            <span className="font-medium text-[10px] italic text-rose-600 truncate w-full mt-0.5">
                                                {opp.motivoPerda || 'Motivo N/A'}
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td className="p-5">
                                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(opp)}
                                            className="text-amber-500 hover:bg-amber-50 hover:text-amber-600 p-2 rounded-lg border border-transparent hover:border-amber-200 transition-all shadow-sm"
                                            title="Editar Lead"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleGeneratePDF(opp)}
                                            className="text-blue-500 hover:bg-blue-50 hover:text-blue-600 p-2 rounded-lg border border-transparent hover:border-blue-200 transition-all shadow-sm"
                                            title="Gerar PDF"
                                        >
                                            <FileText size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(opp)}
                                            className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 p-2 rounded-lg border border-transparent hover:border-rose-200 transition-all shadow-sm"
                                            title="Excluir Definitivamente"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredOpportunities.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="bg-slate-50 p-4 rounded-full mb-3">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-600 mb-1">Nenhum registro encontrado</h4>
                        <p className="text-sm text-slate-400">Tente ajustar seus filtros ou termos de pesquisa acima.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
