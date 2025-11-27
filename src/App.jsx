import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, User, Phone, Wrench, Car, Search, DollarSign, XCircle, 
  CheckCircle, ClipboardList, Briefcase, Download, LogOut, Shield, Lock,
  LayoutDashboard, PlusCircle, TrendingUp, Target, List, Trash2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, serverTimestamp, query, 
  orderBy, limit, onSnapshot, getDocs, deleteDoc, doc
} from 'firebase/firestore';
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInWithCustomToken 
} from 'firebase/auth';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// ============================================================================
// CONFIGURAÇÃO FIREBASE
// ============================================================================

// Importa a configuração do seu arquivo local (Correto para VS Code)
import { firebaseConfig } from './firebaseConfig';

// --- INICIALIZAÇÃO ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const COLLECTION_NAME = 'kobber_opportunities';

// --- CONFIGURAÇÕES DE NEGÓCIO ---
// Adicione aqui os emails que podem baixar relatórios e excluir registros
const ADMIN_EMAILS = [
  "admin@kobber.com.br", 
  "diretoria@kobber.com.br", 
  "ti@kobber.com.br",
  "kaduoficial@gmail.com", 
  "cadubraga99@gmail.com"
];

const META_MENSAL = 50000; // Meta de exemplo: R$ 50.000,00

// --- CONSTANTES ---
const ESTADOS_FOCO = ["RS", "SC", "PR", "SP", "Outro"];

const ORIGENS_CLIENTE = [
  "Redes Sociais (Insta/Face)",
  "Google (Pesquisa)",
  "Google Maps (Meu Negócio)",
  "OLX / Marketplace",
  "Indicação",
  "Já era cliente",
  "Passante (Frente loja)"
];

const MOTIVOS_PERDA = [
  "Falta de Estoque",
  "Preço (Concorrência)",
  "Prazo/Frete",
  "Só pesquisando/Curioso",
  "Cliente vai pensar"
];

// --- FUNÇÕES AUXILIARES ---
const parseCurrency = (valueStr) => {
  if (!valueStr) return 0;
  return parseFloat(valueStr.replace(/[^\d,]/g, '').replace(',', '.'));
};

const formatCurrency = (value) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- COMPONENTES UI ---
const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4 border-b pb-2 border-slate-200 mt-6">
    <Icon className="w-5 h-5 text-blue-600" />
    <h3 className="font-bold text-slate-700 uppercase text-sm tracking-wide">{title}</h3>
  </div>
);

const SelectButton = ({ selected, options, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const isSelected = selected === opt;
      return (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
            isSelected
              ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-105">
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-20`}>
      <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

// --- TELA DE LOGIN ---
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Erro ao entrar. Verifique email e senha.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-800" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Kobber CRM</h1>
          <p className="text-slate-500">Acesso Restrito</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm text-center">{error}</div>}
          <div>
             <label className="text-sm font-medium text-slate-700">Email Corporativo</label>
             <input type="email" required className="w-full p-3 border rounded-lg mt-1" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
             <label className="text-sm font-medium text-slate-700">Senha</label>
             <input type="password" required className="w-full p-3 border rounded-lg mt-1" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-800 text-white font-bold py-3 rounded-lg hover:bg-blue-900 transition-colors">
            {loading ? 'Entrando...' : 'ACESSAR SISTEMA'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState('form'); 
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form State
  const initialFormState = {
    clienteNome: '', clienteTelefone: '', clienteEmail: '', clienteCidade: '', clienteUF: 'RS',
    tipoCliente: 'Consumidor Final', oficinaNome: '', oficinaFoco: '', pecaProcurada: '',
    veiculoModelo: '', origem: '', houveVenda: null, valorVenda: '', motivoPerda: '', pecaFaltante: '', observacoes: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- EFEITOS ---
  useEffect(() => {
    const initAuth = async () => {
      // Se tiver token do ambiente de teste, tenta usar (apenas precaução)
      if (typeof __initial_auth_token !== 'undefined') {
         try { await signInWithCustomToken(auth, __initial_auth_token); } catch(e){}
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(u && u.email ? ADMIN_EMAILS.includes(u.email) : false);
    });
    return () => unsubscribe();
  }, []);

  // Buscar dados
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllOpportunities(data);
    });
    return () => unsubscribe();
  }, [user]);

  // --- CÁLCULOS DO DASHBOARD ---
  const stats = useMemo(() => {
    let totalVendido = 0;
    let vendasCount = 0;
    let perdasCount = 0;
    const vendasPorVendedor = {};
    const motivosPerda = {};

    allOpportunities.forEach(opp => {
      if (opp.houveVenda) {
        totalVendido += parseCurrency(opp.valorVenda);
        vendasCount++;
        const nomeVendedor = opp.vendedorEmail ? opp.vendedorEmail.split('@')[0] : 'Desc.';
        vendasPorVendedor[nomeVendedor] = (vendasPorVendedor[nomeVendedor] || 0) + parseCurrency(opp.valorVenda);
      } else {
        perdasCount++;
        const motivo = opp.motivoPerda || 'Outro';
        motivosPerda[motivo] = (motivosPerda[motivo] || 0) + 1;
      }
    });

    const taxaConversao = (vendasCount + perdasCount) > 0 
      ? Math.round((vendasCount / (vendasCount + perdasCount)) * 100) 
      : 0;

    const chartVendedores = Object.keys(vendasPorVendedor).map(k => ({ name: k, valor: vendasPorVendedor[k] }));
    const chartPerdas = Object.keys(motivosPerda).map(k => ({ name: k, value: motivosPerda[k] }));
    const progressoMeta = Math.min((totalVendido / META_MENSAL) * 100, 100);

    return { totalVendido, vendasCount, perdasCount, taxaConversao, chartVendedores, chartPerdas, progressoMeta };
  }, [allOpportunities]);

  // --- HANDLERS ---
  const handleExportCSV = async () => {
    if (!user || !isAdmin) return;
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      let csv = "Data,Vendedor,Cliente,Telefone,Email,Cidade,UF,Tipo,Oficina,Foco,Veiculo,Peca,Origem,Venda?,Valor,Motivo,Peca Faltante,Obs\n";
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        const date = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '';
        const clean = (t) => t ? `"${t.toString().replace(/"/g, '""')}"` : "";
        csv += `${date},${clean(d.vendedorEmail)},${clean(d.clienteNome)},${clean(d.clienteTelefone)},${clean(d.clienteEmail)},${clean(d.clienteCidade)},${clean(d.clienteUF)},${clean(d.tipoCliente)},${clean(d.oficinaNome)},${clean(d.oficinaFoco)},${clean(d.veiculoModelo)},${clean(d.pecaProcurada)},${clean(d.origem)},${d.houveVenda?"SIM":"NÃO"},${clean(d.valorVenda)},${clean(d.motivoPerda)},${clean(d.pecaFaltante)},${clean(d.observacoes)}\n`;
      });
      const link = document.createElement("a");
      link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
      link.download = `kobber_leads_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err) { alert("Erro ao exportar."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("ATENÇÃO: Deseja realmente excluir este registro? Essa ação não pode ser desfeita e afetará o histórico.")) return;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      setSuccessMsg("Registro excluído com sucesso.");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      alert("Erro ao excluir: " + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (!formData.clienteNome || formData.houveVenda === null) throw new Error("Preencha campos obrigatórios");
      await addDoc(collection(db, COLLECTION_NAME), {
        ...formData,
        vendedorEmail: user.email,
        vendedorUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setSuccessMsg('Salvo com sucesso!');
      setFormData(initialFormState);
      setTimeout(() => setSuccessMsg(''), 3000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">
      
      {/* --- HEADER --- */}
      <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded text-blue-900"><Car size={24} /></div>
            <div>
              <h1 className="text-xl font-bold leading-none tracking-tight">KOBBER</h1>
              <span className="text-xs text-blue-200 font-medium tracking-widest">CRM 2.2</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs text-blue-200 hidden sm:block">{user.email}</span>
             <button onClick={() => signOut(auth)} className="p-2 hover:bg-blue-800 rounded-lg" title="Sair"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      {/* --- NAVEGAÇÃO --- */}
      <div className="bg-white shadow border-b border-slate-200 sticky top-14 z-40">
        <div className="max-w-5xl mx-auto flex overflow-x-auto">
          <button 
            onClick={() => setCurrentView('form')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-sm min-w-[140px] ${currentView === 'form' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <PlusCircle size={18} /> NOVO
          </button>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-sm min-w-[140px] ${currentView === 'dashboard' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={18} /> DASHBOARD
          </button>
          {isAdmin && (
            <button 
              onClick={() => setCurrentView('admin')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-sm min-w-[140px] ${currentView === 'admin' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <List size={18} /> GERENCIAR
            </button>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 mt-6">
        
        {/* FEEDBACK GERAL */}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-6 h-6" /><span className="font-bold">{successMsg}</span>
          </div>
        )}

        {/* ================= VIEW: DASHBOARD ================= */}
        {currentView === 'dashboard' && (
          <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Vendido" value={formatCurrency(stats.totalVendido)} icon={DollarSign} colorClass="bg-green-500 text-green-600" />
              <StatCard title="Taxa de Conversão" value={`${stats.taxaConversao}%`} icon={TrendingUp} colorClass="bg-blue-500 text-blue-600" />
              <StatCard title="Vendas Feitas" value={stats.vendasCount} icon={CheckCircle} colorClass="bg-purple-500 text-purple-600" />
              <StatCard title="Oport. Perdidas" value={stats.perdasCount} icon={XCircle} colorClass="bg-red-500 text-red-600" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-end mb-2">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Target className="text-red-500"/> Meta Mensal</h3>
                <span className="text-sm font-semibold text-slate-500">{formatCurrency(stats.totalVendido)} / {formatCurrency(META_MENSAL)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-green-400 h-4 rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.progressoMeta}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
                <h3 className="font-bold text-slate-700 mb-4">Ranking de Vendas (R$)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartVendedores}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip formatter={(v) => formatCurrency(v)} /><Bar dataKey="valor" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
                <h3 className="font-bold text-slate-700 mb-4">Motivos de Perda</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={stats.chartPerdas} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>{stats.chartPerdas.map((e, i) => <Cell key={i} fill={['#ef4444', '#f59e0b', '#6366f1', '#10b981'][i % 4]} />)}</Pie><Tooltip /><Legend /></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {isAdmin && <button onClick={handleExportCSV} className="w-full bg-slate-800 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-700"><Download size={18}/> Exportar Relatório Completo</button>}
          </div>
        )}

        {/* ================= VIEW: GERENCIAR (ADMIN) ================= */}
        {currentView === 'admin' && isAdmin && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-700">Gerenciamento de Registros</h3>
              <p className="text-xs text-slate-500">Exclua registros de teste ou duplicados.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-4">Data</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Vendedor</th>
                    <th className="p-4">Resultado</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allOpportunities.map(opp => (
                    <tr key={opp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        {opp.createdAt ? new Date(opp.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                        <br/><span className="text-xs text-slate-400">{opp.createdAt ? new Date(opp.createdAt.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{opp.clienteNome}</div>
                        <div className="text-xs text-slate-500">{opp.pecaProcurada}</div>
                      </td>
                      <td className="p-4 text-slate-600">
                          {opp.vendedorEmail ? opp.vendedorEmail.split('@')[0] : '...'}
                      </td>
                      <td className="p-4">
                        {opp.houveVenda ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            VENDA {opp.valorVenda}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            PERDA
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDelete(opp.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir Registro"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allOpportunities.length === 0 && (
                <div className="p-8 text-center text-slate-400 italic">Nenhum registro encontrado.</div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW: FORMULÁRIO ================= */}
        {currentView === 'form' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-600 animate-fade-in">
            
            <SectionTitle icon={Briefcase} title="1. Cliente" />
            <div className="grid md:grid-cols-2 gap-4 mb-4">
               <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <input required className="w-full p-3 border rounded-lg" value={formData.clienteNome} onChange={e => setFormData({...formData, clienteNome: e.target.value})} />
               </div>
               <div>
                  <label className="text-sm font-medium">WhatsApp</label>
                  <input className="w-full p-3 border rounded-lg" value={formData.clienteTelefone} onChange={e => setFormData({...formData, clienteTelefone: e.target.value})} />
               </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className="w-full p-3 border rounded-lg" value={formData.clienteEmail} onChange={e => setFormData({...formData, clienteEmail: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium">Cidade</label>
                  <input className="w-full p-3 border rounded-lg" value={formData.clienteCidade} onChange={e => setFormData({...formData, clienteCidade: e.target.value})} />
                </div>
                <div className="w-24">
                  <label className="text-sm font-medium">UF</label>
                  <select className="w-full p-3 border rounded-lg bg-white" value={formData.clienteUF} onChange={e => setFormData({...formData, clienteUF: e.target.value})}>
                    {ESTADOS_FOCO.map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <SectionTitle icon={Wrench} title="2. Tipo de Cliente" />
            <div className="flex gap-4 mb-4">
              <label className={`flex-1 cursor-pointer border rounded-lg p-4 flex items-center justify-center gap-2 ${formData.tipoCliente === 'Consumidor Final' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'hover:bg-slate-50'}`}>
                <input type="radio" name="tipoCliente" className="hidden" checked={formData.tipoCliente === 'Consumidor Final'} onChange={() => setFormData({...formData, tipoCliente: 'Consumidor Final'})} />
                <User size={20} /> Consumidor
              </label>
              <label className={`flex-1 cursor-pointer border rounded-lg p-4 flex items-center justify-center gap-2 ${formData.tipoCliente === 'Oficina' ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500' : 'hover:bg-slate-50'}`}>
                <input type="radio" name="tipoCliente" className="hidden" checked={formData.tipoCliente === 'Oficina'} onChange={() => setFormData({...formData, tipoCliente: 'Oficina'})} />
                <Wrench size={20} /> Oficina
              </label>
            </div>
            {formData.tipoCliente === 'Oficina' && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4 animate-fade-in">
                <div className="mb-3">
                  <label className="text-sm font-medium text-orange-800">Nome da Oficina</label>
                  <input className="w-full p-2 border border-orange-300 rounded" value={formData.oficinaNome} onChange={e => setFormData({...formData, oficinaNome: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-orange-800">Foco / Serviços</label>
                  <input className="w-full p-2 border border-orange-300 rounded" placeholder="Ex: Suspensão..." value={formData.oficinaFoco} onChange={e => setFormData({...formData, oficinaFoco: e.target.value})} />
                </div>
              </div>
            )}
            
            <SectionTitle icon={Search} title="3. Oportunidade" />
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium">Peça Procurada *</label>
                <input required className="w-full p-3 border rounded-lg" value={formData.pecaProcurada} onChange={e => setFormData({...formData, pecaProcurada: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Veículo (Modelo/Ano)</label>
                <input className="w-full p-3 border rounded-lg" value={formData.veiculoModelo} onChange={e => setFormData({...formData, veiculoModelo: e.target.value})} />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Como conheceu a Kobber?</label>
              <SelectButton options={ORIGENS_CLIENTE} selected={formData.origem} onSelect={v => setFormData({...formData, origem: v})} />
            </div>

            <SectionTitle icon={DollarSign} title="4. Resultado" />
            <div className="flex gap-4 mb-4">
              <button type="button" onClick={() => setFormData({...formData, houveVenda: true})} className={`flex-1 p-4 rounded border-2 ${formData.houveVenda ? 'border-green-500 bg-green-50 text-green-700 font-bold' : ''}`}>VENDA</button>
              <button type="button" onClick={() => setFormData({...formData, houveVenda: false})} className={`flex-1 p-4 rounded border-2 ${formData.houveVenda === false ? 'border-red-500 bg-red-50 text-red-700 font-bold' : ''}`}>NÃO VENDEU</button>
            </div>

            {formData.houveVenda && (
               <div className="mb-4">
                  <label className="text-green-700 font-bold">Valor (R$)</label>
                  <input 
                    className="w-full p-3 border-2 border-green-200 rounded text-lg font-bold" 
                    placeholder="0,00" 
                    value={formData.valorVenda}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "") / 100;
                      setFormData({...formData, valorVenda: v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                    }}
                  />
               </div>
            )}
            {formData.houveVenda === false && (
               <div className="mb-4">
                 <label className="text-red-700 font-bold mb-2 block">Motivo</label>
                 <SelectButton options={MOTIVOS_PERDA} selected={formData.motivoPerda} onSelect={v => setFormData({...formData, motivoPerda: v})} />
                 {formData.motivoPerda === 'Falta de Estoque' && (
                    <div className="mt-4">
                      <label className="text-sm font-bold text-red-700">Qual peça faltou?</label>
                      <input className="w-full p-2 border border-red-300 rounded" placeholder="Para compras..." value={formData.pecaFaltante} onChange={e => setFormData({...formData, pecaFaltante: e.target.value})} />
                    </div>
                 )}
               </div>
            )}

            <SectionTitle icon={ClipboardList} title="Obs / Próximo Passo" />
            <textarea className="w-full p-3 border rounded-lg mb-6 h-24 resize-none" placeholder="Detalhes..." value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} />

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold mt-6 hover:bg-blue-700">
              {loading ? 'Salvando...' : 'REGISTRAR'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}