import React, { useState, useEffect, useMemo } from 'react';
import {
  Car, LogOut, LayoutDashboard, PlusCircle, List
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, updateDoc, serverTimestamp, query,
  orderBy, onSnapshot, getDocs, deleteDoc, doc, where, limit
} from 'firebase/firestore';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { format, isSameMonth } from 'date-fns';
import { jsPDF } from "jspdf";

// Componentes
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import LeadForm from './components/LeadForm';
import LeadList from './components/LeadList';

// Utils / Config
import { firebaseConfig } from './firebaseConfig';
import { ADMIN_EMAILS, META_MENSAL } from './utils/constants';

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const COLLECTION_NAME = 'kobber_opportunities';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState('form');
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dashboard
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Formulário
  const initialFormState = {
    clienteNome: '', clienteTelefone: '', clienteEmail: '', clienteCidade: '',
    clienteUF: 'RS', tipoCliente: 'Consumidor Final', oficinaNome: '', oficinaFoco: '',
    pecaProcurada: '', veiculoModelo: '', origem: '', houveVenda: null, valorVenda: '',
    motivoPerda: '', pecaFaltante: '', observacoes: '', canalVenda: 'Online', metodoPagamento: 'Pix'
  };
  const [formData, setFormData] = useState(initialFormState);
  const [historyMatch, setHistoryMatch] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // --- EFEITOS DE CICLO DE VIDA ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(u && u.email ? ADMIN_EMAILS.includes(u.email) : false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllOpportunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (editingId) return;
    const checkHistory = async () => {
      if (!formData.clienteTelefone || formData.clienteTelefone.length < 8) {
        setHistoryMatch(null);
        return;
      }
      try {
        const q = query(collection(db, COLLECTION_NAME), where("clienteTelefone", "==", formData.clienteTelefone), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) setHistoryMatch(snap.docs[0].data());
        else setHistoryMatch(null);
      } catch (e) {
        console.error(e);
      }
    };
    const t = setTimeout(checkHistory, 800);
    return () => clearTimeout(t);
  }, [formData.clienteTelefone, editingId]);

  // --- FUNÇÕES AUXILIARES ---
  const parseCurrency = (valueStr) => {
    if (!valueStr) return 0;
    if (typeof valueStr === 'number') return valueStr;
    return parseFloat(valueStr.toString().replace(/[^\d,]/g, '').replace(',', '.'));
  };

  // --- STATS PARA O DASHBOARD ---
  const stats = useMemo(() => {
    let total = 0, vendas = 0, perdas = 0, vendedores = {}, motivos = {};
    const monthOpps = allOpportunities.filter(o => o.createdAt && isSameMonth(new Date(o.createdAt.seconds * 1000), selectedDate));

    monthOpps.forEach(o => {
      if (o.houveVenda) {
        total += parseCurrency(o.valorVenda);
        vendas++;
        const n = o.vendedorEmail?.split('@')[0];
        const nf = n ? n.charAt(0).toUpperCase() + n.slice(1) : 'Desconhecido';
        vendedores[nf] = (vendedores[nf] || 0) + parseCurrency(o.valorVenda);
      } else {
        perdas++;
        const m = o.motivoPerda || 'Outro';
        motivos[m] = (motivos[m] || 0) + 1;
      }
    });

    const conv = (vendas + perdas) > 0 ? Math.round((vendas / (vendas + perdas)) * 100) : 0;

    return {
      totalVendido: total,
      vendasCount: vendas,
      perdasCount: perdas,
      taxaConversao: conv,
      chartVendedores: Object.keys(vendedores).map(k => ({ name: k, valor: vendedores[k] })).sort((a, b) => b.valor - a.valor),
      chartPerdas: Object.keys(motivos).map(k => ({ name: k, value: motivos[k] })),
      progressoMeta: Math.min((total / META_MENSAL) * 100, 100)
    };
  }, [allOpportunities, selectedDate]);

  // --- LOGIN HANDLER ---
  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("Erro ao entrar. Verifique credenciais.");
    }
  };

  // --- HANDLERS PRINCIPAIS ---
  const handleEdit = (opp) => {
    setFormData(opp);
    setEditingId(opp.id);
    setCurrentView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleDelete = async (opp) => {
    if (!isAdmin) return;
    if (confirm("Deseja realmente excluir este registro? Não há como desfazer.")) {
      await deleteDoc(doc(db, COLLECTION_NAME, opp.id));
    }
  };

  const loadHistoryData = () => {
    if (historyMatch) {
      setFormData({ ...formData, ...historyMatch, valorVenda: '', houveVenda: null, observacoes: '' });
    }
  };

  // --- FORM SUBMIT (CRIAR/ATUALIZAR) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, COLLECTION_NAME, editingId), { ...formData });
        alert("Registro atualizado com sucesso!");
      } else {
        await addDoc(collection(db, COLLECTION_NAME), {
          ...formData,
          vendedorEmail: user.email,
          vendedorUid: user.uid,
          createdAt: serverTimestamp()
        });
        alert("Nova oportunidade registrada com sucesso!");
      }

      setFormData(initialFormState);
      setHistoryMatch(null);
      setEditingId(null);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error("Erro ao salvar:", error);
      setLoading(false);
      alert("Erro ao salvar. Verifique a conexão com o banco de dados.");
    }
  };

  // --- EXPORTAR E AÇÕES ESPECÍFICAS DA TABELA ---
  const handleWhatsApp = (c) => {
    if (!c.clienteTelefone) return alert("Cliente não possui telefone cadastrado.");
    const p = c.clienteTelefone.replace(/\D/g, '');
    if (p.length < 10) return alert("Número de telefone parece inválido.");
    const msg = c.houveVenda
      ? `Olá ${c.clienteNome.split(' ')[0]}, tudo bem? Agradecemos a confiança! 🚗`
      : `Olá ${c.clienteNome.split(' ')[0]}, tudo bem? Vi que conversamos sobre *${c.pecaProcurada || 'uma peça'}*. Posso te ajudar com isso hoje?`;
    window.open(`https://wa.me/${p.length <= 11 ? `55${p}` : p}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleGeneratePDF = (data) => {
    const docPdf = new jsPDF();
    docPdf.text(`Comprovante / Registro: ${data.clienteNome}`, 20, 20);
    docPdf.text(`Peça: ${data.pecaProcurada || '-'}`, 20, 30);
    docPdf.text(`Veículo: ${data.veiculoModelo || '-'}`, 20, 40);
    docPdf.text(`Resultado: ${data.houveVenda ? 'Venda R$ ' + data.valorVenda : 'Perda'}`, 20, 50);
    docPdf.save(`Registro_${data.clienteNome.split(' ').join('_')}.pdf`);
  };

  const handleExportCSV = (renderedOpportunities, sourceFilterName) => {
    if (!isAdmin) return alert("Restrito para administradores.");
    const headers = ["email,phone,fn,ct,st,country,value,event_time,status,origem"];
    const rows = renderedOpportunities.map(opp => {
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
    link.setAttribute("download", `kobber_leads_${sourceFilterName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDERIZAÇÃO PRINCIPAL ---
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">

      {/* HEADER NATIVO PREMIUM */}
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl sticky top-0 z-50 order-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md shadow-inner border border-white/20">
              <Car size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-blue-50 to-indigo-200">KOBBER</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">CRM 3.0 Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <span className="text-[10px] text-indigo-300 block uppercase font-bold tracking-widest">Sessão Ativa</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <button
              onClick={() => signOut(auth)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 shadow-sm"
              title="Encerrar Sessão"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* TABS DE APPS NAVEGAÇÃO */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-[73px] z-40">
        <div className="max-w-6xl mx-auto flex px-4 gap-2">
          <button
            onClick={() => { setCurrentView('form'); handleCancelEdit(); }}
            className={`flex-1 py-4 font-bold text-sm flex justify-center items-center gap-2 transition-all border-b-[3px] ${currentView === 'form'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-300'
              }`}
          >
            <PlusCircle size={18} className={currentView === 'form' ? 'animate-pulse' : ''} />
            {editingId ? 'EDITANDO' : 'NOVO REGISTRO'}
          </button>

          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex-1 py-4 font-bold text-sm flex justify-center items-center gap-2 transition-all border-b-[3px] ${currentView === 'dashboard'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-300'
              }`}
          >
            <LayoutDashboard size={18} />
            METAS & DASH
          </button>

          {isAdmin && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex-1 py-4 font-bold text-sm flex justify-center items-center gap-2 transition-all border-b-[3px] ${currentView === 'admin'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-300'
                }`}
            >
              <List size={18} />
              GERENCIAR (DB)
            </button>
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL RENDERIZADOR */}
      <main className="max-w-6xl mx-auto px-4 mt-8">

        {currentView === 'dashboard' && (
          <Dashboard
            stats={stats}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        )}

        {currentView === 'admin' && isAdmin && (
          <LeadList
            allOpportunities={allOpportunities}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleGeneratePDF={handleGeneratePDF}
            handleWhatsApp={handleWhatsApp}
            handleExportCSV={handleExportCSV}
          />
        )}

        {currentView === 'form' && (
          <div className="max-w-3xl mx-auto relative">
            <LeadForm
              formData={formData}
              setFormData={setFormData}
              loading={loading}
              editingId={editingId}
              handleCancelEdit={handleCancelEdit}
              handleSubmit={handleSubmit}
              historyMatch={historyMatch}
              loadHistoryData={loadHistoryData}
            />
          </div>
        )}

      </main>
    </div>
  );
}