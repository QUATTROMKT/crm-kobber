import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, User, Wrench, Car, Search, DollarSign, XCircle, 
  CheckCircle, ClipboardList, Briefcase, Download, LogOut, Lock,
  LayoutDashboard, PlusCircle, TrendingUp, Target, List, Trash2,
  CreditCard, ShoppingBag, Award, ChevronLeft, ChevronRight, Calendar,
  MessageCircle, History, FileText, Filter, Globe, Store, Edit2, X
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, updateDoc, serverTimestamp, query, 
  orderBy, onSnapshot, getDocs, deleteDoc, doc, where, limit
} from 'firebase/firestore';
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie
} from 'recharts';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from "jspdf";
import { firebaseConfig } from './firebaseConfig';

// --- INICIALIZAÇÃO ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const COLLECTION_NAME = 'kobber_opportunities';

// --- CONFIGURAÇÕES ---
const ADMIN_EMAILS = ["admin@kobber.com.br", "diretoria@kobber.com.br", "ti@kobber.com.br", "kaduoficial@gmail.com", "cadubraga99@gmail.com"];
const META_MENSAL = 75000;
const ESTADOS_FOCO = ["RS", "SC", "PR", "SP", "Outro"];
const ORIGENS_CLIENTE = ["Meta Ads (Face/Insta)", "Google (Pesquisa)", "Google Maps (Meu Negócio)", "OLX / Marketplace", "Indicação", "Já era cliente", "Passante (Frente loja)", "WhatsApp (Orgânico)"];
const MOTIVOS_PERDA = ["Falta de Estoque", "Preço (Concorrência)", "Prazo/Frete", "Só pesquisando/Curioso", "Cliente vai pensar"];
const CANAIS_VENDA = ["Online", "Balcão"];
const METODOS_PAGAMENTO = ["Pix", "Crédito", "Débito", "Dinheiro", "Boleto"];

// --- FUNÇÕES AUXILIARES ---
const parseCurrency = (valueStr) => {
  if (!valueStr) return 0;
  if (typeof valueStr === 'number') return valueStr;
  return parseFloat(valueStr.toString().replace(/[^\d,]/g, '').replace(',', '.'));
};
const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// --- COMPONENTES UI ---
const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4 border-b pb-2 border-slate-200 mt-6">
    <Icon className="w-5 h-5 text-blue-600" />
    <h3 className="font-bold text-slate-700 uppercase text-sm tracking-wide">{title}</h3>
  </div>
);
const SelectButton = ({ selected, options, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button key={opt} type="button" onClick={() => onSelect(opt)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${selected === opt ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>{opt}</button>
    ))}
  </div>
);
const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-105">
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-20`}><Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} /></div>
    <div><p className="text-sm text-slate-500">{title}</p><p className="text-xl font-bold text-slate-800">{value}</p></div>
  </div>
);

// --- LOGIN ---
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password); } catch (err) { setError("Erro ao entrar."); setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-blue-800" /></div>
        <h1 className="text-2xl font-bold text-slate-800">Kobber CRM</h1>
        <form onSubmit={handleLogin} className="space-y-4 mt-6">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
          <input type="email" placeholder="Email" required className="w-full p-3 border rounded-lg" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Senha" required className="w-full p-3 border rounded-lg" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full bg-blue-800 text-white font-bold py-3 rounded-lg hover:bg-blue-900">{loading ? 'Entrando...' : 'ACESSAR'}</button>
        </form>
      </div>
    </div>
  );
};

// --- APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState('form'); 
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [historyMatch, setHistoryMatch] = useState(null);
  
  // ESTADOS DE FILTRO E EDIÇÃO
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all'); 
  const [editingId, setEditingId] = useState(null);

  // Mantive 'Online' como sugestão inicial, mas você pode mudar clicando nos botões.
  const initialFormState = { clienteNome: '', clienteTelefone: '', clienteEmail: '', clienteCidade: '', clienteUF: 'RS', tipoCliente: 'Consumidor Final', oficinaNome: '', oficinaFoco: '', pecaProcurada: '', veiculoModelo: '', origem: '', houveVenda: null, valorVenda: '', motivoPerda: '', pecaFaltante: '', observacoes: '', canalVenda: 'Online', metodoPagamento: 'Pix' };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setIsAdmin(u && u.email ? ADMIN_EMAILS.includes(u.email) : false); }); return () => unsubscribe(); }, []);
  useEffect(() => { if (!user) return; const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc')); const unsubscribe = onSnapshot(q, (snapshot) => { setAllOpportunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); return () => unsubscribe(); }, [user]);
  
  useEffect(() => {
    if(editingId) return; 
    const checkHistory = async () => {
        if (!formData.clienteTelefone || formData.clienteTelefone.length < 8) { setHistoryMatch(null); return; }
        try { const q = query(collection(db, COLLECTION_NAME), where("clienteTelefone", "==", formData.clienteTelefone), limit(1)); const snap = await getDocs(q); if (!snap.empty) setHistoryMatch(snap.docs[0].data()); else setHistoryMatch(null); } catch (e) { console.error(e); }
    };
    const t = setTimeout(checkHistory, 800); return () => clearTimeout(t);
  }, [formData.clienteTelefone, editingId]);

  // --- FILTRAGEM INTELIGENTE (AQUI ESTÁ A CORREÇÃO DE LÓGICA) ---
  const filteredOpportunities = useMemo(() => {
    let data = allOpportunities;
    
    // 1. Lógica para ONLINE: Pega tudo que é digital (inclusive WhatsApp) OU que foi marcado como Online
    if (sourceFilter === 'online') {
      data = data.filter(opp => 
        opp.origem?.includes("Meta") || 
        opp.origem?.includes("Google") || 
        opp.origem?.includes("Site") || 
        opp.origem?.includes("WhatsApp") || // <--- WhatsApp SEMPRE entra aqui
        opp.vendedorEmail === 'sistema@kobber.com.br' || 
        opp.canalVenda === 'Online'
      );
    } 
    // 2. Lógica para MANUAL (Loja): Exclui estritamente tudo que é digital
    else if (sourceFilter === 'manual') {
      data = data.filter(opp => 
        !opp.origem?.includes("Meta") && 
        !opp.origem?.includes("Google") && 
        !opp.origem?.includes("Site") && 
        !opp.origem?.includes("WhatsApp") && // <--- WhatsApp NUNCA entra aqui
        opp.vendedorEmail !== 'sistema@kobber.com.br' && 
        opp.canalVenda !== 'Online'
      );
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(opp => (opp.clienteNome && opp.clienteNome.toLowerCase().includes(lowerTerm)) || (opp.pecaProcurada && opp.pecaProcurada.toLowerCase().includes(lowerTerm)) || (opp.veiculoModelo && opp.veiculoModelo.toLowerCase().includes(lowerTerm)));
    }
    return data;
  }, [allOpportunities, searchTerm, sourceFilter]);

  // --- STATS ---
  const stats = useMemo(() => {
    let total=0, vendas=0, perdas=0, vendedores={}, motivos={};
    const monthOpps = allOpportunities.filter(o => o.createdAt && isSameMonth(new Date(o.createdAt.seconds*1000), selectedDate));
    monthOpps.forEach(o => {
      if (o.houveVenda) { total+=parseCurrency(o.valorVenda); vendas++; const n=o.vendedorEmail?.split('@')[0]; const nf=n.charAt(0).toUpperCase()+n.slice(1); vendedores[nf]=(vendedores[nf]||0)+parseCurrency(o.valorVenda); }
      else { perdas++; const m=o.motivoPerda||'Outro'; motivos[m]=(motivos[m]||0)+1; }
    });
    const conv = (vendas+perdas)>0 ? Math.round((vendas/(vendas+perdas))*100) : 0;
    return { totalVendido: total, vendasCount: vendas, perdasCount: perdas, taxaConversao: conv, chartVendedores: Object.keys(vendedores).map(k=>({name:k, valor:vendedores[k]})).sort((a,b)=>b.valor-a.valor), chartPerdas: Object.keys(motivos).map(k=>({name:k, value:motivos[k]})), progressoMeta: Math.min((total/META_MENSAL)*100, 100) };
  }, [allOpportunities, selectedDate]);

  // --- HANDLERS ---
  const handleWhatsApp = (c) => { 
      if(!c.clienteTelefone) return alert("Sem telefone."); 
      const p = c.clienteTelefone.replace(/\D/g,''); 
      if(p.length<10) return alert("Número inválido."); 
      const msg = c.houveVenda ? `Olá ${c.clienteNome.split(' ')[0]}, tudo bem? Agradecemos a compra! 🚗` : `Olá ${c.clienteNome.split(' ')[0]}, tudo bem? Vi seu interesse no(a) *${c.pecaProcurada || 'peça'}*. Podemos ajudar?`; 
      window.open(`https://wa.me/${p.length<=11?`55${p}`:p}?text=${encodeURIComponent(msg)}`, '_blank'); 
  };
  
  const handleGeneratePDF = (data) => {
    const doc = new jsPDF();
    doc.text(`Comprovante: ${data.clienteNome}`, 20, 20);
    doc.save("doc.pdf");
  };

  const handleExportCSV = () => {
    if (!isAdmin) return alert("Apenas administradores podem exportar.");
    const headers = ["email,phone,fn,ct,st,country,value,event_time,status,origem"];
    const rows = filteredOpportunities.map(opp => {
      const email = opp.clienteEmail?.toLowerCase().trim() || "";
      let phone = opp.clienteTelefone?.replace(/\D/g, "") || "";
      if (phone.length > 0 && !phone.startsWith("55")) phone = "55" + phone;
      const fn = opp.clienteNome?.split(" ")[0] || "";
      const ct = opp.clienteCidade || "";
      const st = opp.clienteUF || "";
      const val = opp.houveVenda ? parseCurrency(opp.valorVenda) : 0;
      const time = opp.createdAt ? Math.floor(opp.createdAt.seconds) : "";
      const status = opp.houveVenda ? "purchase" : "lead";
      return `${email},${phone},${fn},${ct},${st},BR,${val},${time},${status},${opp.origem || 'Manual'}`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `kobber_leads_${sourceFilter}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- NOVA FUNÇÃO: INICIAR EDIÇÃO ---
  const handleEdit = (opp) => {
    setFormData(opp); // Preenche o formulário com os dados do lead
    setEditingId(opp.id); // Avisa o sistema que estamos editando este ID
    setCurrentView('form'); // Leva o usuário para a tela do formulário
    window.scrollTo({top:0, behavior:'smooth'});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleDelete = async (opp) => { if(!isAdmin) return; if(confirm("Excluir?")) await deleteDoc(doc(db, COLLECTION_NAME, opp.id)); };
  
  // --- SUBMIT INTELIGENTE (CRIAR OU ATUALIZAR) ---
  const handleSubmit = async (e) => { 
      e.preventDefault(); 
      setLoading(true); 
      
      try {
        if (editingId) {
            // MODO EDIÇÃO: ATUALIZA
            await updateDoc(doc(db, COLLECTION_NAME, editingId), { 
                ...formData, 
            });
            alert("Registro atualizado com sucesso!");
        } else {
            // MODO CRIAÇÃO: NOVO
            await addDoc(collection(db, COLLECTION_NAME), { 
                ...formData, 
                vendedorEmail: user.email, 
                vendedorUid: user.uid, 
                createdAt: serverTimestamp() 
            });
            alert("Novo registro salvo!");
        }
        
        setFormData(initialFormState); 
        setHistoryMatch(null); 
        setEditingId(null); // Sai do modo edição
        setLoading(false); 
        window.scrollTo({top:0, behavior:'smooth'});
        
      } catch (error) {
          console.error("Erro ao salvar:", error);
          setLoading(false);
          alert("Erro ao salvar. Tente novamente.");
      }
  };

  const loadHistoryData = () => { if(historyMatch) setFormData({...formData, ...historyMatch, valorVenda: '', houveVenda: null, obs: ''}); };

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">
      <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2"><Car size={24} /><div><h1 className="text-xl font-bold">KOBBER</h1><span className="text-xs">CRM 3.0 PRO</span></div></div>
          <div className="flex items-center gap-3"><span className="text-xs hidden sm:block">{user.email}</span><button onClick={() => signOut(auth)}><LogOut size={20}/></button></div>
        </div>
      </header>
      <div className="bg-white shadow border-b sticky top-14 z-40">
        <div className="max-w-5xl mx-auto flex">
          <button onClick={() => {setCurrentView('form'); handleCancelEdit();}} className={`flex-1 py-4 font-bold text-sm flex justify-center gap-2 ${currentView === 'form' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-500'}`}><PlusCircle size={18}/> {editingId ? 'EDITANDO' : 'NOVO'}</button>
          <button onClick={() => setCurrentView('dashboard')} className={`flex-1 py-4 font-bold text-sm flex justify-center gap-2 ${currentView === 'dashboard' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-500'}`}><LayoutDashboard size={18}/> DASHBOARD</button>
          {isAdmin && <button onClick={() => setCurrentView('admin')} className={`flex-1 py-4 font-bold text-sm flex justify-center gap-2 ${currentView === 'admin' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-500'}`}><List size={18}/> GERENCIAR</button>}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 mt-6">
        {/* DASHBOARD */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                <button onClick={()=>setSelectedDate(d=>subMonths(d,1))} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft/></button>
                <div className="flex items-center gap-2"><Calendar className="text-blue-600"/><h2 className="text-xl font-bold capitalize">{format(selectedDate, 'MMMM yyyy', {locale: ptBR})}</h2></div>
                <button onClick={()=>setSelectedDate(d=>addMonths(d,1))} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Vendido" value={formatCurrency(stats.totalVendido)} icon={DollarSign} colorClass="bg-green-500 text-green-600" />
              <StatCard title="Conversão" value={`${stats.taxaConversao}%`} icon={TrendingUp} colorClass="bg-blue-500 text-blue-600" />
              <StatCard title="Vendas" value={stats.vendasCount} icon={CheckCircle} colorClass="bg-purple-500 text-purple-600" />
              <StatCard title="Perdas" value={stats.perdasCount} icon={XCircle} colorClass="bg-red-500 text-red-600" />
            </div>
            {/* Gráficos e Barras de Meta */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between mb-2"><span className="font-bold">Meta ({formatCurrency(META_MENSAL)})</span><span>{stats.progressoMeta.toFixed(1)}%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-4"><div className="bg-blue-600 h-4 rounded-full transition-all" style={{width: `${stats.progressoMeta}%`}}></div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-xl h-96 flex flex-col">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Award className="text-yellow-500"/> Ranking</h3>
                  <div className="flex-1 overflow-y-auto">{stats.chartVendedores.map((v,i)=><div key={i} className="flex justify-between p-2 border-b"><span className="font-bold">{i+1}. {v.name}</span><span>{formatCurrency(v.valor)}</span></div>)}</div>
                  <div className="h-32"><ResponsiveContainer><BarChart data={stats.chartVendedores}><Bar dataKey="valor" fill="#2563eb" /></BarChart></ResponsiveContainer></div>
               </div>
               <div className="bg-white p-6 rounded-xl h-96"><h3 className="font-bold mb-4">Perdas</h3><ResponsiveContainer><PieChart><Pie data={stats.chartPerdas} dataKey="value" cx="50%" cy="50%" outerRadius={80} fill="#ef4444" label /></PieChart></ResponsiveContainer></div>
            </div>
          </div>
        )}

        {/* GERENCIAR (COM BOTÃO DE EDIÇÃO) */}
        {currentView === 'admin' && isAdmin && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden animate-fade-in">
            <div className="p-4 bg-slate-50 border-b flex flex-col gap-4">
                <div className="flex justify-between items-center">
                   <div><h3 className="font-bold text-slate-700">Gerenciamento</h3><p className="text-xs text-slate-500">Filtrando: {sourceFilter === 'all' ? 'Tudo' : sourceFilter === 'online' ? 'Leads Online' : 'Loja Física'}</p></div>
                   <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-2"><Download size={16} /> <span className="hidden sm:inline">CSV</span></button>
                </div>
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="flex bg-slate-200 p-1 rounded-lg">
                        <button onClick={()=>setSourceFilter('all')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${sourceFilter==='all'?'bg-white text-blue-700 shadow-sm':'text-slate-500'}`}><List size={16}/> Todos</button>
                        <button onClick={()=>setSourceFilter('manual')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${sourceFilter==='manual'?'bg-white text-blue-700 shadow-sm':'text-slate-500'}`}><Store size={16}/> Loja (Manual)</button>
                        <button onClick={()=>setSourceFilter('online')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${sourceFilter==='online'?'bg-white text-blue-700 shadow-sm':'text-slate-500'}`}><Globe size={16}/> Online (Ads)</button>
                    </div>
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                        <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold text-xs uppercase"><tr><th className="p-4">Data</th><th className="p-4">Cliente</th><th className="p-4">Origem</th><th className="p-4">Status</th><th className="p-4 text-right">Ações</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOpportunities.map(opp => (
                    <tr key={opp.id} className="hover:bg-slate-50">
                      <td className="p-4 whitespace-nowrap">{opp.createdAt ? new Date(opp.createdAt.seconds*1000).toLocaleDateString() : '-'}</td>
                      <td className="p-4">
                          <div className="font-bold text-slate-800 flex items-center gap-2">{opp.clienteNome} {opp.clienteTelefone && <button onClick={()=>handleWhatsApp(opp)} className="text-green-600 hover:bg-green-100 p-1 rounded"><MessageCircle size={14}/></button>}</div>
                          <div className="text-xs text-slate-500">{opp.pecaProcurada || <span className='text-orange-500 italic'>Não preenchido</span>} - {opp.veiculoModelo}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${
                            opp.origem?.includes("Meta") || opp.origem?.includes("Site") 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : opp.origem?.includes("WhatsApp") 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                           {opp.origem || 'Manual'}
                        </span>
                      </td>
                      <td className="p-4">{opp.houveVenda ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">VENDA {opp.valorVenda}</span> : <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">ABERTO</span>}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={()=>handleEdit(opp)} className="text-orange-500 hover:bg-orange-50 p-2 rounded" title="Editar / Preencher"><Edit2 size={18}/></button>
                          <button onClick={()=>handleGeneratePDF(opp)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><FileText size={18}/></button>
                          <button onClick={()=>handleDelete(opp)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOpportunities.length === 0 && <div className="p-8 text-center text-slate-400">Nenhum registro encontrado nesta categoria.</div>}
            </div>
          </div>
        )}

        {/* FORMULÁRIO */}
        {currentView === 'form' && (
          <form onSubmit={handleSubmit} className={`bg-white rounded-xl shadow-md p-6 border-t-4 ${editingId ? 'border-orange-500' : 'border-blue-600'} animate-fade-in`}>
            {editingId && (
                <div className="bg-orange-50 border border-orange-200 p-4 mb-6 rounded flex justify-between items-center">
                    <div className="flex items-center gap-2 text-orange-800 font-bold"><Edit2 size={20}/> <span>EDITANDO REGISTRO: {formData.clienteNome}</span></div>
                    <button type="button" onClick={handleCancelEdit} className="text-sm bg-white border border-orange-300 text-orange-700 px-3 py-1 rounded hover:bg-orange-100">Cancelar Edição</button>
                </div>
            )}
            
            {!editingId && historyMatch && <div className="mb-6 bg-blue-50 p-4 rounded border-blue-200 flex gap-3"><History className="text-blue-600"/><div className="flex-1"><h4 className="font-bold text-blue-800">Cliente Recorrente!</h4><p className="text-sm">Última compra de <strong>{historyMatch.clienteNome}</strong> em {new Date(historyMatch.createdAt.seconds*1000).toLocaleDateString()}.</p><button type="button" onClick={loadHistoryData} className="text-xs bg-blue-600 text-white px-3 py-1 rounded mt-2">Usar dados</button></div></div>}
            
            <SectionTitle icon={Briefcase} title="1. Cliente" />
            <div className="grid md:grid-cols-2 gap-4 mb-4">
               <div><label className="text-sm font-bold text-slate-600">Nome *</label><input required className="w-full p-3 border rounded" value={formData.clienteNome} onChange={e => setFormData({...formData, clienteNome: e.target.value})} /></div>
               <div><label className="text-sm font-bold text-slate-600">WhatsApp</label><input className="w-full p-3 border rounded" placeholder="Busca automática..." value={formData.clienteTelefone} onChange={e => setFormData({...formData, clienteTelefone: e.target.value})} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4"><div><label className="text-sm font-bold text-slate-600">Email</label><input type="email" className="w-full p-3 border rounded" value={formData.clienteEmail} onChange={e => setFormData({...formData, clienteEmail: e.target.value})} /></div><div className="flex gap-2"><div className="flex-1"><label className="text-sm font-bold text-slate-600">Cidade</label><input className="w-full p-3 border rounded" value={formData.clienteCidade} onChange={e => setFormData({...formData, clienteCidade: e.target.value})} /></div><div className="w-24"><label className="text-sm font-bold text-slate-600">UF</label><select className="w-full p-3 border rounded bg-white" value={formData.clienteUF} onChange={e => setFormData({...formData, clienteUF: e.target.value})}>{ESTADOS_FOCO.map(u=><option key={u} value={u}>{u}</option>)}</select></div></div></div>
            <SectionTitle icon={Wrench} title="2. Tipo" />
            <div className="flex gap-4 mb-4"><label className={`flex-1 p-4 border rounded flex justify-center gap-2 cursor-pointer ${formData.tipoCliente==='Consumidor Final'?'bg-blue-50 border-blue-500':''}`}><input type="radio" className="hidden" onClick={()=>setFormData({...formData, tipoCliente: 'Consumidor Final'})}/><User/> Consumidor</label><label className={`flex-1 p-4 border rounded flex justify-center gap-2 cursor-pointer ${formData.tipoCliente==='Oficina'?'bg-orange-50 border-orange-500':''}`}><input type="radio" className="hidden" onClick={()=>setFormData({...formData, tipoCliente: 'Oficina'})}/><Wrench/> Oficina</label></div>
            {formData.tipoCliente === 'Oficina' && <div className="bg-orange-50 p-4 mb-4 rounded border-orange-200"><input className="w-full p-2 border mb-2 rounded" placeholder="Nome da Oficina" value={formData.oficinaNome} onChange={e=>setFormData({...formData, oficinaNome: e.target.value})} /><input className="w-full p-2 border rounded" placeholder="Foco (Ex: Suspensão)" value={formData.oficinaFoco} onChange={e=>setFormData({...formData, oficinaFoco: e.target.value})} /></div>}
            <SectionTitle icon={Search} title="3. Oportunidade" />
            <div className="grid md:grid-cols-2 gap-4 mb-4"><div><label className="text-sm font-bold text-slate-600">Peça *</label><input required className="w-full p-3 border rounded" value={formData.pecaProcurada} onChange={e => setFormData({...formData, pecaProcurada: e.target.value})} /></div><div><label className="text-sm font-bold text-slate-600">Veículo</label><input className="w-full p-3 border rounded" value={formData.veiculoModelo} onChange={e => setFormData({...formData, veiculoModelo: e.target.value})} /></div></div>
            <div className="mb-4"><label className="text-sm font-bold text-slate-600 mb-2 block">Origem</label><SelectButton options={ORIGENS_CLIENTE} selected={formData.origem} onSelect={v => setFormData({...formData, origem: v})} /></div>
            <SectionTitle icon={DollarSign} title="4. Resultado" />
            <div className="flex gap-4 mb-4"><button type="button" onClick={()=>setFormData({...formData, houveVenda: true})} className={`flex-1 p-4 border rounded font-bold ${formData.houveVenda?'bg-green-500 text-white':''}`}>VENDA</button><button type="button" onClick={()=>setFormData({...formData, houveVenda: false})} className={`flex-1 p-4 border rounded font-bold ${formData.houveVenda===false?'bg-red-500 text-white':''}`}>PERDA</button></div>
            {formData.houveVenda && <div className="bg-green-50 p-4 rounded border-green-100 mb-4"><div className="mb-4"><label className="text-green-800 font-bold">Valor (R$)</label><input className="w-full p-3 border text-lg font-bold" placeholder="0,00" value={formData.valorVenda} onChange={e=>{const v=e.target.value.replace(/\D/g,"")/100; setFormData({...formData, valorVenda:v.toLocaleString("pt-BR",{minimumFractionDigits:2})})}} /></div><div className="flex gap-4"><div className="flex-1"><label className="text-sm font-bold">Pagamento</label><select className="w-full p-2 border rounded" value={formData.metodoPagamento} onChange={e=>setFormData({...formData, metodoPagamento:e.target.value})}>{METODOS_PAGAMENTO.map(m=><option key={m} value={m}>{m}</option>)}</select></div><div className="flex-1"><label className="text-sm font-bold">Canal</label><div className="flex gap-1">{CANAIS_VENDA.map(c=><button key={c} type="button" onClick={()=>setFormData({...formData, canalVenda: c})} className={`flex-1 py-2 text-xs border rounded ${formData.canalVenda===c?'bg-green-600 text-white':'bg-white'}`}>{c}</button>)}</div></div></div></div>}
            {formData.houveVenda===false && <div className="bg-red-50 p-4 rounded border-red-100 mb-4"><label className="text-red-800 font-bold mb-2 block">Motivo</label><SelectButton options={MOTIVOS_PERDA} selected={formData.motivoPerda} onSelect={v => setFormData({...formData, motivoPerda: v})} />{formData.motivoPerda==='Falta de Estoque'&&<input className="w-full p-2 border mt-2 rounded" placeholder="Qual peça faltou?" value={formData.pecaFaltante} onChange={e=>setFormData({...formData, pecaFaltante:e.target.value})}/>}</div>}
            <SectionTitle icon={ClipboardList} title="Obs" />
            <textarea className="w-full p-3 border rounded mb-6 h-24" placeholder="Detalhes..." value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} />
            <button type="submit" disabled={loading} className={`w-full text-white py-4 rounded font-bold hover:brightness-90 ${editingId ? 'bg-orange-500' : 'bg-blue-600'}`}>{loading?'Salvando...': editingId ? 'ATUALIZAR REGISTRO' : 'REGISTRAR'}</button>
          </form>
        )}
      </main>
    </div>
  );
}