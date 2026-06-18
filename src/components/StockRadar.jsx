import React, { useState, useMemo } from 'react';
import {
    ShoppingCart, TrendingDown, Boxes, Search, MessageCircle,
    Car, ChevronDown, Copy, Check, PackageX, Clock
} from 'lucide-react';

/**
 * Radar de Estoque & Compras.
 *
 * Transforma cada perda por "Falta de Estoque" em inteligência de compras:
 *  - agrupa as peças que fizeram a loja perder venda;
 *  - estima o R$ perdido cruzando com o ticket médio de vendas semelhantes;
 *  - prioriza a lista de compras por potencial de receita perdida;
 *  - lista os clientes (com WhatsApp) para reabordar quando a peça chegar.
 *
 * 100% client-side: deriva tudo das oportunidades já carregadas do Firestore.
 */

const parseCurrency = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const n = parseFloat(value.toString().replace(/[^\d,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value) =>
    (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const normalize = (s) =>
    (s || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ');

const toDate = (createdAt) =>
    createdAt?.seconds ? new Date(createdAt.seconds * 1000) : null;

const isStockLoss = (o) =>
    o.houveVenda === false && normalize(o.motivoPerda).includes('estoque');

export default function StockRadar({ allOpportunities = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [copied, setCopied] = useState(false);

    const { groups, totals } = useMemo(() => {
        // 1. Ticket médio por peça, com base nas VENDAS fechadas.
        const salesByPart = {};
        allOpportunities.forEach((o) => {
            if (!o.houveVenda) return;
            const key = normalize(o.pecaProcurada);
            if (!key) return;
            const v = parseCurrency(o.valorVenda);
            if (v <= 0) return;
            if (!salesByPart[key]) salesByPart[key] = { total: 0, count: 0 };
            salesByPart[key].total += v;
            salesByPart[key].count += 1;
        });
        const avgFor = (key) =>
            salesByPart[key] && salesByPart[key].count > 0
                ? salesByPart[key].total / salesByPart[key].count
                : null;

        // 2. Agrupa as perdas por falta de estoque.
        const map = {};
        allOpportunities.filter(isStockLoss).forEach((o) => {
            const original = (o.pecaFaltante || o.pecaProcurada || '').trim() || 'Peça não especificada';
            const key = normalize(o.pecaFaltante || o.pecaProcurada) || 'peca-nao-especificada';
            if (!map[key]) {
                map[key] = {
                    key,
                    label: original,
                    labelCounts: {},
                    count: 0,
                    vehicles: new Set(),
                    clients: [],
                    lastDate: null,
                };
            }
            const g = map[key];
            g.count += 1;
            g.labelCounts[original] = (g.labelCounts[original] || 0) + 1;
            if (o.veiculoModelo) g.vehicles.add(o.veiculoModelo.trim());
            const d = toDate(o.createdAt);
            if (d && (!g.lastDate || d > g.lastDate)) g.lastDate = d;
            g.clients.push({
                id: o.id,
                nome: o.clienteNome || 'Cliente',
                telefone: o.clienteTelefone || '',
                veiculo: o.veiculoModelo || '',
                date: d,
            });
        });

        // 3. Finaliza: rótulo mais frequente, valor estimado, ordenação.
        const list = Object.values(map).map((g) => {
            const label = Object.entries(g.labelCounts).sort((a, b) => b[1] - a[1])[0][0];
            const avg = avgFor(g.key);
            const estLost = avg != null ? avg * g.count : null;
            return {
                ...g,
                label,
                vehicles: Array.from(g.vehicles),
                avg,
                estLost,
                clients: g.clients.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)),
            };
        });

        list.sort((a, b) => {
            // Peças com potencial estimado primeiro (por R$), depois por frequência.
            if (a.estLost != null && b.estLost != null) return b.estLost - a.estLost;
            if (a.estLost != null) return -1;
            if (b.estLost != null) return 1;
            return b.count - a.count;
        });

        const totals = {
            lostDeals: list.reduce((sum, g) => sum + g.count, 0),
            estRevenue: list.reduce((sum, g) => sum + (g.estLost || 0), 0),
            distinctParts: list.length,
        };

        return { groups: list, totals };
    }, [allOpportunities]);

    const filtered = useMemo(() => {
        if (!searchTerm) return groups;
        const t = normalize(searchTerm);
        return groups.filter(
            (g) => normalize(g.label).includes(t) || g.vehicles.some((v) => normalize(v).includes(t))
        );
    }, [groups, searchTerm]);

    const openRestockWhatsApp = (client, partLabel) => {
        const raw = (client.telefone || '').replace(/\D/g, '');
        if (raw.length < 10) return;
        const phone = raw.length <= 11 ? `55${raw}` : raw;
        const nome = (client.nome || '').split(' ')[0] || 'tudo bem';
        const msg = `Olá ${nome}! Aqui é da Kobber Auto Peças. 🚗\n\nLembra da *${partLabel}* que você procurou${client.veiculo ? ` para o ${client.veiculo}` : ''}? Conseguimos a peça aqui! Ainda tem interesse?`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const copyPurchaseList = async () => {
        const lines = filtered.map((g, i) => {
            const valor = g.estLost != null ? ` — potencial ${formatCurrency(g.estLost)}` : '';
            const apps = g.vehicles.length ? ` (${g.vehicles.slice(0, 3).join(', ')})` : '';
            return `${i + 1}. ${g.label}${apps} — ${g.count} pedido(s) perdido(s)${valor}`;
        });
        const text =
            `🛒 LISTA DE COMPRAS PRIORITÁRIA — Kobber Auto Peças\n` +
            `Gerada em ${new Date().toLocaleDateString('pt-BR')}\n` +
            `Potencial total perdido: ${formatCurrency(totals.estRevenue)}\n\n` +
            lines.join('\n');
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            alert('Não foi possível copiar. Copie manualmente:\n\n' + text);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl text-white shadow-lg shadow-amber-200">
                            <Boxes size={18} />
                        </div>
                        Radar de Estoque & Compras
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Tudo que você deixou de vender por falta de peça — virando lista de compras.
                    </p>
                </div>
                {filtered.length > 0 && (
                    <button
                        onClick={copyPurchaseList}
                        className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copiado!' : 'Copiar lista de compras'}
                    </button>
                )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-rose-500/10">
                        <PackageX className="w-7 h-7 text-rose-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Vendas perdidas por falta</p>
                        <p className="text-2xl font-extrabold text-slate-800">{totals.lostDeals}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-amber-500/10">
                        <TrendingDown className="w-7 h-7 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Potencial perdido (est.)</p>
                        <p className="text-2xl font-extrabold text-slate-800">{formatCurrency(totals.estRevenue)}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-indigo-500/10">
                        <ShoppingCart className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Peças distintas em falta</p>
                        <p className="text-2xl font-extrabold text-slate-800">{totals.distinctParts}</p>
                    </div>
                </div>
            </div>

            {/* Busca */}
            {groups.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Filtrar por peça ou veículo..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* Lista priorizada */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <div className="bg-emerald-50 p-4 rounded-full w-fit mx-auto mb-3">
                        <Boxes className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-600 mb-1">
                        {groups.length === 0 ? 'Nenhuma perda por falta de estoque registrada' : 'Nada encontrado'}
                    </h4>
                    <p className="text-sm text-slate-400">
                        {groups.length === 0
                            ? 'Quando um atendimento for perdido com o motivo "Falta de Estoque", a peça aparece aqui.'
                            : 'Ajuste o filtro de busca acima.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((g, i) => {
                        const isOpen = expanded === g.key;
                        return (
                            <div key={g.key} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <button
                                    onClick={() => setExpanded(isOpen ? null : g.key)}
                                    className="w-full p-5 flex items-center gap-4 text-left hover:bg-slate-50/60 transition-colors"
                                >
                                    <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-black ${i === 0 ? 'bg-amber-400 text-white' :
                                        i === 1 ? 'bg-slate-300 text-slate-700' :
                                            i === 2 ? 'bg-orange-300 text-orange-900' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-extrabold text-slate-800 truncate">{g.label}</div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                            <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                                                <PackageX size={12} /> {g.count} perdida{g.count > 1 ? 's' : ''}
                                            </span>
                                            {g.vehicles.length > 0 && (
                                                <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                                                    <Car size={12} /> {g.vehicles.slice(0, 2).join(', ')}{g.vehicles.length > 2 ? ` +${g.vehicles.length - 2}` : ''}
                                                </span>
                                            )}
                                            {g.lastDate && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock size={12} /> {g.lastDate.toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        {g.estLost != null ? (
                                            <>
                                                <div className="font-black text-amber-600">{formatCurrency(g.estLost)}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wide">potencial</div>
                                            </>
                                        ) : (
                                            <div className="text-[11px] text-slate-400 italic max-w-[90px]">sem venda de referência</div>
                                        )}
                                    </div>
                                    <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isOpen && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 animate-fade-in">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                                            Clientes para reabordar quando a peça chegar
                                        </p>
                                        <div className="space-y-2">
                                            {g.clients.map((c) => (
                                                <div key={c.id} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-100 px-4 py-2.5">
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-sm text-slate-700 truncate">{c.nome}</div>
                                                        <div className="text-xs text-slate-400 truncate">
                                                            {c.veiculo || 'veículo n/d'}{c.date ? ` · ${c.date.toLocaleDateString('pt-BR')}` : ''}
                                                        </div>
                                                    </div>
                                                    {c.telefone ? (
                                                        <button
                                                            onClick={() => openRestockWhatsApp(c, g.label)}
                                                            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                                                            title="Avisar que a peça chegou"
                                                        >
                                                            <MessageCircle size={15} /> Avisar
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-slate-300 italic shrink-0">sem telefone</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
