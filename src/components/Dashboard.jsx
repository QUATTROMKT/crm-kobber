import React from 'react';
import {
    BarChart, Bar, ResponsiveContainer, PieChart, Pie, Tooltip, XAxis
} from 'recharts';
import {
    ChevronLeft, ChevronRight, Calendar, TrendingUp,
    DollarSign, CheckCircle, XCircle, Award
} from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatCard } from './UIComponents';
import { META_MENSAL } from '../utils/constants';

const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Dashboard({ stats, selectedDate, setSelectedDate }) {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Controle de Mês */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <button
                    onClick={() => setSelectedDate(d => subMonths(d, 1))}
                    className="p-3 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-xl transition-colors shadow-sm border border-transparent hover:border-slate-200"
                >
                    <ChevronLeft />
                </button>
                <div className="flex items-center justify-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                        <Calendar className="text-indigo-600 w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-800 capitalize tracking-tight">
                        {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                </div>
                <button
                    onClick={() => setSelectedDate(d => addMonths(d, 1))}
                    className="p-3 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-xl transition-colors shadow-sm border border-transparent hover:border-slate-200"
                >
                    <ChevronRight />
                </button>
            </div>

            {/* Cards de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    title="Faturamento Mensal"
                    value={formatCurrency(stats.totalVendido)}
                    icon={DollarSign}
                    colorClass="bg-emerald-500 text-emerald-600"
                />
                <StatCard
                    title="Taxa de Conversão"
                    value={`${stats.taxaConversao}%`}
                    icon={TrendingUp}
                    colorClass="bg-indigo-500 text-indigo-600"
                />
                <StatCard
                    title="Vendas Fechadas"
                    value={stats.vendasCount}
                    icon={CheckCircle}
                    colorClass="bg-blue-500 text-blue-600"
                />
                <StatCard
                    title="Negócios Perdidos"
                    value={stats.perdasCount}
                    icon={XCircle}
                    colorClass="bg-rose-500 text-rose-600"
                />
            </div>

            {/* Progressão de Meta */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10"></div>
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Meta Global</p>
                        <span className="text-2xl font-black text-slate-800">{formatCurrency(META_MENSAL)}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-bold text-slate-500 mb-1 block">Atingimento</span>
                        <span className={`text-3xl font-black ${stats.progressoMeta >= 100 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                            {stats.progressoMeta.toFixed(1)}%
                        </span>
                    </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-5 shadow-inner overflow-hidden">
                    <div
                        className={`h-5 rounded-full transition-all duration-1000 ease-out relative ${stats.progressoMeta >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`}
                        style={{ width: `${Math.min(stats.progressoMeta, 100)}%` }}
                    >
                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Gráficos em Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">

                {/* Ranking de Vendedores */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-[420px] flex flex-col">
                    <h3 className="font-extrabold text-slate-800 mb-6 flex items-center gap-3 text-lg">
                        <div className="p-2 bg-amber-100 rounded-lg"><Award className="text-amber-500 w-5 h-5" /></div>
                        Ranking de Faturamento
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-6">
                        {stats.chartVendedores.map((v, i) => (
                            <div key={i} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-400 text-white' :
                                            i === 1 ? 'bg-slate-300 text-slate-700' :
                                                i === 2 ? 'bg-orange-300 text-orange-800' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {i + 1}
                                    </span>
                                    <span className="font-bold text-slate-700">{v.name}</span>
                                </div>
                                <span className="font-black text-indigo-900">{formatCurrency(v.valor)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartVendedores} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="valor" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Perdas */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-[420px] flex flex-col">
                    <h3 className="font-extrabold text-slate-800 mb-2 flex items-center gap-3 text-lg">
                        <div className="p-2 bg-rose-100 rounded-lg"><XCircle className="text-rose-500 w-5 h-5" /></div>
                        Análise de Perdas
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">Motivos principais de não conversão no período.</p>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.chartPerdas}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#f43f5e"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
