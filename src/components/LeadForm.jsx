import React from 'react';
import {
    Briefcase, Wrench, User, Search, DollarSign,
    ClipboardList, Edit2, History
} from 'lucide-react';
import { SectionTitle, SelectButton } from './UIComponents';
import SmartPaste from './SmartPaste';
import {
    ESTADOS_FOCO,
    ORIGENS_CLIENTE,
    MOTIVOS_PERDA,
    CANAIS_VENDA,
    METODOS_PAGAMENTO
} from '../utils/constants';

export default function LeadForm({
    formData,
    setFormData,
    loading,
    editingId,
    handleCancelEdit,
    handleSubmit,
    historyMatch,
    loadHistoryData
}) {

    const handleSmartParse = (data) => {
        // Mescla os dados extraídos pelo Magic Paste com o estado atual
        setFormData(prev => ({
            ...prev,
            ...data,
            // Não sobrescreve se já houver algo manualmente digitado, a menos que o campo estivesse vazio
            clienteNome: data.clienteNome || prev.clienteNome,
            clienteTelefone: data.clienteTelefone || prev.clienteTelefone,
            clienteCidade: data.clienteCidade || prev.clienteCidade,
            tipoCliente: data.tipoCliente || prev.tipoCliente,
            oficinaNome: data.oficinaNome || prev.oficinaNome,
            pecaProcurada: data.pecaProcurada || prev.pecaProcurada,
            veiculoModelo: data.veiculoModelo || prev.veiculoModelo,
            observacoes: data.observacoes ? (prev.observacoes ? prev.observacoes + '\n---\nAI Extraído:\n' + data.observacoes : data.observacoes) : prev.observacoes
        }));
    };

    const handleCurrencyChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, "");
        const formatted = (parseFloat(rawValue) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        setFormData({ ...formData, valorVenda: rawValue ? formatted : '' });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={`bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-t-4 ${editingId ? 'border-orange-500' : 'border-indigo-600'} animate-fade-in relative overflow-hidden`}
        >
            {/* Background sutil */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/2 -translate-y-1/2"></div>

            {!editingId && <SmartPaste onParse={handleSmartParse} />}

            {editingId && (
                <div className="bg-orange-50 border border-orange-200 p-4 mb-6 rounded-xl flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-2 text-orange-800 font-bold">
                        <Edit2 size={20} />
                        <span>EDITANDO REGISTRO: {formData.clienteNome}</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-sm bg-white border border-orange-300 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors font-medium shadow-sm"
                    >
                        Cancelar Edição
                    </button>
                </div>
            )}

            {!editingId && historyMatch && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex gap-3 shadow-sm transform hover:scale-[1.01] transition-all">
                    <History className="text-indigo-600 mt-1" />
                    <div className="flex-1">
                        <h4 className="font-extrabold text-indigo-900">Cliente Recorrente Reconhecido!</h4>
                        <p className="text-sm text-indigo-700 mb-2 mt-1">
                            Último atendimento de <strong>{historyMatch.clienteNome}</strong> em {new Date(historyMatch.createdAt.seconds * 1000).toLocaleDateString()}.
                        </p>
                        <button
                            type="button"
                            onClick={loadHistoryData}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow"
                        >
                            Restaurar Dados Anteriores
                        </button>
                    </div>
                </div>
            )}

            {/* 1. Cliente */}
            <SectionTitle icon={Briefcase} title="1. Dados do Cliente" />
            <div className="grid md:grid-cols-2 gap-5 mb-6">
                <div>
                    <label className="text-sm font-bold text-slate-700 mb-1 block">Nome Completo *</label>
                    <input
                        required
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                        placeholder="Ex: João Silva"
                        value={formData.clienteNome}
                        onChange={e => setFormData({ ...formData, clienteNome: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-bold text-slate-700 mb-1 block">WhatsApp / Telefone</label>
                    <input
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                        placeholder="(55) 99999-9999"
                        value={formData.clienteTelefone}
                        onChange={e => setFormData({ ...formData, clienteTelefone: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-8">
                <div>
                    <label className="text-sm font-bold text-slate-700 mb-1 block">Email</label>
                    <input
                        type="email"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                        placeholder="contato@cliente.com"
                        value={formData.clienteEmail}
                        onChange={e => setFormData({ ...formData, clienteEmail: e.target.value })}
                    />
                </div>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="text-sm font-bold text-slate-700 mb-1 block">Cidade</label>
                        <input
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            placeholder="Ex: Santa Maria"
                            value={formData.clienteCidade}
                            onChange={e => setFormData({ ...formData, clienteCidade: e.target.value })}
                        />
                    </div>
                    <div className="w-28">
                        <label className="text-sm font-bold text-slate-700 mb-1 block">UF</label>
                        <select
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none cursor-pointer"
                            value={formData.clienteUF}
                            onChange={e => setFormData({ ...formData, clienteUF: e.target.value })}
                        >
                            {ESTADOS_FOCO.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Tipo */}
            <SectionTitle icon={Wrench} title="2. Perfil do Comprador" />
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <label className={`flex-1 p-5 border-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-3 cursor-pointer transition-all ${formData.tipoCliente === 'Consumidor Final' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm transform scale-[1.02]' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-600'}`}>
                    <input type="radio" className="hidden" onClick={() => setFormData({ ...formData, tipoCliente: 'Consumidor Final' })} />
                    <div className={`p-2 rounded-full ${formData.tipoCliente === 'Consumidor Final' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                        <User size={24} />
                    </div>
                    <span className="font-bold text-lg">Consumidor Final</span>
                </label>

                <label className={`flex-1 p-5 border-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-3 cursor-pointer transition-all ${formData.tipoCliente === 'Oficina' ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm transform scale-[1.02]' : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50 text-slate-600'}`}>
                    <input type="radio" className="hidden" onClick={() => setFormData({ ...formData, tipoCliente: 'Oficina' })} />
                    <div className={`p-2 rounded-full ${formData.tipoCliente === 'Oficina' ? 'bg-orange-100' : 'bg-slate-100'}`}>
                        <Wrench size={24} />
                    </div>
                    <span className="font-bold text-lg">Oficina / Mecânico</span>
                </label>
            </div>

            {formData.tipoCliente === 'Oficina' && (
                <div className="bg-orange-50/50 p-5 mb-8 rounded-2xl border border-orange-200/60 animate-fade-in">
                    <input
                        className="w-full p-3.5 mb-3 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-orange-300"
                        placeholder="Nome da Oficina parceira"
                        value={formData.oficinaNome}
                        onChange={e => setFormData({ ...formData, oficinaNome: e.target.value })}
                    />
                    <input
                        className="w-full p-3.5 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-orange-300"
                        placeholder="Foco principal (Ex: Suspensão, Motores...)"
                        value={formData.oficinaFoco}
                        onChange={e => setFormData({ ...formData, oficinaFoco: e.target.value })}
                    />
                </div>
            )}

            {/* 3. Oportunidade */}
            <SectionTitle icon={Search} title="3. O que o cliente procura?" />
            <div className="grid md:grid-cols-2 gap-5 mb-6">
                <div>
                    <label className="text-sm font-bold text-slate-700 mb-1 block">Peça / Produto *</label>
                    <input
                        required
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Ex: Amortecedor Dianteiro"
                        value={formData.pecaProcurada}
                        onChange={e => setFormData({ ...formData, pecaProcurada: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-bold text-slate-700 mb-1 block">Aplicação (Veículo/Ano)</label>
                    <input
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Ex: Honda Civic 2014"
                        value={formData.veiculoModelo}
                        onChange={e => setFormData({ ...formData, veiculoModelo: e.target.value })}
                    />
                </div>
            </div>

            <div className="mb-8">
                <label className="text-sm font-bold text-slate-700 mb-3 block">Origem do Contato</label>
                <SelectButton
                    options={ORIGENS_CLIENTE}
                    selected={formData.origem}
                    onSelect={v => setFormData({ ...formData, origem: v })}
                />
            </div>

            {/* 4. Resultado */}
            <SectionTitle icon={DollarSign} title="4. Desfecho do Atendimento" />
            <div className="flex gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, houveVenda: true })}
                    className={`flex-1 p-5 sm:p-6 border-2 rounded-2xl font-extrabold text-lg transition-all flex flex-col items-center justify-center gap-2 ${formData.houveVenda
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 transform scale-105'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500'
                        }`}
                >
                    <DollarSign size={32} className={formData.houveVenda ? 'text-white' : 'text-slate-300'} />
                    VENDA FECHADA
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, houveVenda: false })}
                    className={`flex-1 p-5 sm:p-6 border-2 rounded-2xl font-extrabold text-lg transition-all flex flex-col items-center justify-center gap-2 ${formData.houveVenda === false
                            ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30 transform scale-105'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500'
                        }`}
                >
                    <span className={`text-3xl ${formData.houveVenda === false ? 'text-white' : 'text-slate-300'}`}>✗</span>
                    NEGÓCIO PERDIDO
                </button>
            </div>

            {formData.houveVenda && (
                <div className="bg-emerald-50/80 p-6 rounded-2xl border border-emerald-200/60 mb-8 animate-slide-up shadow-sm">
                    <div className="mb-5">
                        <label className="text-emerald-900 font-extrabold mb-2 block">Valor Total (R$)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xl">R$</span>
                            <input
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-emerald-300 rounded-xl text-3xl font-black text-emerald-800 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                                placeholder="0,00"
                                value={formData.valorVenda}
                                onChange={handleCurrencyChange}
                            />
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                            <label className="text-sm font-bold text-emerald-800 mb-2 block">Método de Pagamento</label>
                            <select
                                className="w-full p-3.5 bg-white border border-emerald-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-900"
                                value={formData.metodoPagamento}
                                onChange={e => setFormData({ ...formData, metodoPagamento: e.target.value })}
                            >
                                {METODOS_PAGAMENTO.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-emerald-800 mb-2 block">Canal de Fechamento</label>
                            <div className="flex gap-2 bg-white p-1 rounded-xl border border-emerald-200">
                                {CANAIS_VENDA.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, canalVenda: c })}
                                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.canalVenda === c
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'text-emerald-700 hover:bg-emerald-50'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {formData.houveVenda === false && (
                <div className="bg-rose-50/80 p-6 rounded-2xl border border-rose-200/60 mb-8 animate-slide-up shadow-sm">
                    <label className="text-rose-900 font-extrabold mb-3 block">Qual foi o motivo principal?</label>
                    <SelectButton
                        options={MOTIVOS_PERDA}
                        selected={formData.motivoPerda}
                        onSelect={v => setFormData({ ...formData, motivoPerda: v })}
                    />
                    {formData.motivoPerda === 'Falta de Estoque' && (
                        <div className="mt-4 animate-fade-in">
                            <input
                                className="w-full p-4 bg-white border border-rose-300 text-rose-900 placeholder-rose-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                                placeholder="Qual peça exata faltou? (Vai para lista de compras)"
                                value={formData.pecaFaltante}
                                onChange={e => setFormData({ ...formData, pecaFaltante: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Obs */}
            <SectionTitle icon={ClipboardList} title="Observações ou Próximos Passos" />
            <textarea
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-8 h-32 resize-none text-slate-700"
                placeholder="Adicione detalhes contextuais, lembretes para retorno ou solicitações do cliente..."
                value={formData.observacoes}
                onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
            />

            <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-5 rounded-2xl font-black text-lg shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed ${editingId
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-orange-500/30'
                        : 'bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 shadow-indigo-600/30'
                    }`}
            >
                {loading ? (
                    <span className="animate-pulse flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processando Registro...
                    </span>
                ) : editingId ? (
                    'ATUALIZAR REGISTRO NO SISTEMA'
                ) : (
                    'SALVAR OPORTUNIDADE NO CRM'
                )}
            </button>
        </form>
    );
}
