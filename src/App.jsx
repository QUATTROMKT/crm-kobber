import React, { useState, useEffect } from 'react';
import { 
  Save, User, Phone, Wrench, Car, Search, DollarSign, XCircle, 
  CheckCircle, ClipboardList, Briefcase, Download, LogOut, Shield, Lock
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, serverTimestamp, query, 
  orderBy, limit, onSnapshot, getDocs 
} from 'firebase/firestore';
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut 
} from 'firebase/auth';

// IMPORTANTE: Importando a configuração do arquivo que você criou
import { firebaseConfig } from './firebaseConfig';

// --- INICIALIZAÇÃO FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Use um ID fixo ou pegue do config se necessário. 
// Para simplificar, vamos usar um nome de coleção fixo.
const COLLECTION_NAME = 'kobber_opportunities';

// --- SEGURANÇA: EMAILS DE ADMINISTRADORES ---
const ADMIN_EMAILS = [
  "admin@kobber.com.br", 
  "diretoria@kobber.com.br",
  "ti@kobber.com.br"
  // Adicione seu email real aqui para testar o botão de download
];

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
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError("Email ou senha incorretos.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Muitas tentativas. Tente novamente mais tarde.");
      } else {
        setError("Erro ao entrar: " + err.message);
      }
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
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm text-center">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" required
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="vendedor@kobber.com.br"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input 
              type="password" required
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
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
  const [authLoading, setAuthLoading] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [recentOpps, setRecentOpps] = useState([]);
  const [exporting, setExporting] = useState(false);

  // Form State
  const initialFormState = {
    clienteNome: '',
    clienteTelefone: '',
    clienteEmail: '',
    clienteCidade: '',
    clienteUF: 'RS',
    tipoCliente: 'Consumidor Final', 
    oficinaNome: '',
    oficinaFoco: '',
    pecaProcurada: '',
    veiculoModelo: '',
    origem: '',
    houveVenda: null,
    valorVenda: '',
    motivoPerda: '',
    pecaFaltante: '',
    observacoes: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email) {
        setIsAdmin(ADMIN_EMAILS.includes(u.email));
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data Effect
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentOpps(data);
    }, (error) => console.error("Erro busca:", error));
    return () => unsubscribe();
  }, [user]);

  // Handlers
  const handleExportCSV = async () => {
    if (!user || !isAdmin) return;
    setExporting(true);
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Data,Vendedor,Cliente,Telefone,Email,Cidade,UF,Tipo,Oficina,Foco,Veiculo,Peca,Origem,Venda?,Valor,Motivo,Peca Faltante,Obs\n";

      querySnapshot.forEach((doc) => {
        const d = doc.data();
        const date = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '';
        const clean = (txt) => txt ? `"${txt.toString().replace(/"/g, '""')}"` : "";

        const row = [
          date,
          clean(d.vendedorEmail),
          clean(d.clienteNome),
          clean(d.clienteTelefone),
          clean(d.clienteEmail),
          clean(d.clienteCidade),
          clean(d.clienteUF),
          clean(d.tipoCliente),
          clean(d.oficinaNome),
          clean(d.oficinaFoco),
          clean(d.veiculoModelo),
          clean(d.pecaProcurada),
          clean(d.origem),
          d.houveVenda ? "SIM" : "NÃO",
          clean(d.valorVenda),
          clean(d.motivoPerda),
          clean(d.pecaFaltante),
          clean(d.observacoes)
        ].join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `kobber_leads_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar. Verifique o console.");
    } finally {
      setExporting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const formatted = (parseFloat(rawValue) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    handleChange('valorVenda', rawValue ? formatted : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      if (!formData.clienteNome || formData.houveVenda === null) {
        alert("Preencha Nome do Cliente e Resultado da Venda.");
        setLoading(false);
        return;
      }
      
      const emailVendedor = user.email || 'anonimo@sistema.local';

      await addDoc(collection(db, COLLECTION_NAME), {
        ...formData,
        vendedorEmail: emailVendedor,
        vendedorUid: user.uid,
        createdAt: serverTimestamp(),
        userId: user.uid
      });

      setSuccessMsg('Registro salvo!');
      setFormData(initialFormState);
      setTimeout(() => setSuccessMsg(''), 3000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render
  if (authLoading) return <div className="flex items-center justify-center h-screen bg-slate-100">Carregando...</div>;
  if (!user) return <LoginScreen />;

  const displayUser = user.email ? user.email.split('@')[0] : 'Vendedor';

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-10">
      {/* HEADER */}
      <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded text-blue-900"><Car size={24} /></div>
            <div>
              <h1 className="text-xl font-bold leading-none tracking-tight">KOBBER</h1>
              <span className="text-xs text-blue-200 font-medium tracking-widest">CRM</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-blue-300">Logado como</p>
              <div className="flex items-center gap-1">
                {isAdmin && <Shield size={14} className="text-yellow-400"/>}
                <p className="text-sm font-semibold">{user.email}</p>
              </div>
            </div>
            <button onClick={() => signOut(auth)} className="p-2 bg-blue-800 hover:bg-blue-700 rounded-lg" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ADMIN PANEL */}
      {isAdmin && (
        <div className="bg-slate-800 text-white py-4 shadow-inner">
          <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="text-yellow-400" />
              <div><h2 className="font-bold">Painel Admin</h2><p className="text-xs text-slate-400">Exportar Dados</p></div>
            </div>
            <button onClick={handleExportCSV} disabled={exporting} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold text-sm">
              {exporting ? '...' : <><Download size={18} /> CSV</>}
            </button>
          </div>
        </div>
      )}

      {/* MAIN FORM */}
      <main className="max-w-3xl mx-auto px-4 mt-6">
        {successMsg && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-6 h-6" /><span className="font-bold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-600">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Novo Registro</h2>
            <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Usuário: <strong>{displayUser}</strong></div>
          </div>

          <SectionTitle icon={Briefcase} title="1. Dados do Cliente" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
              <input required type="text" className="w-full p-3 border rounded-lg" placeholder="Nome do Cliente" value={formData.clienteNome} onChange={e => handleChange('clienteNome', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
              <input type="tel" className="w-full p-3 border rounded-lg" placeholder="(00) 00000-0000" value={formData.clienteTelefone} onChange={e => handleChange('clienteTelefone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" className="w-full p-3 border rounded-lg" placeholder="email@cliente.com" value={formData.clienteEmail} onChange={e => handleChange('clienteEmail', e.target.value)} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                <input type="text" className="w-full p-3 border rounded-lg" placeholder="Cidade" value={formData.clienteCidade} onChange={e => handleChange('clienteCidade', e.target.value)} />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
                <select className="w-full p-3 border rounded-lg bg-white" value={formData.clienteUF} onChange={e => handleChange('clienteUF', e.target.value)}>
                  {ESTADOS_FOCO.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
          </div>

          <SectionTitle icon={Wrench} title="2. Tipo de Cliente" />
          <div className="mb-4">
            <div className="flex gap-4 mb-4">
              <label className={`flex-1 cursor-pointer border rounded-lg p-4 flex items-center justify-center gap-2 ${formData.tipoCliente === 'Consumidor Final' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : ''}`}>
                <input type="radio" name="tipoCliente" className="hidden" checked={formData.tipoCliente === 'Consumidor Final'} onChange={() => handleChange('tipoCliente', 'Consumidor Final')} />
                <User size={20} /> Consumidor
              </label>
              <label className={`flex-1 cursor-pointer border rounded-lg p-4 flex items-center justify-center gap-2 ${formData.tipoCliente === 'Oficina' ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500' : ''}`}>
                <input type="radio" name="tipoCliente" className="hidden" checked={formData.tipoCliente === 'Oficina'} onChange={() => handleChange('tipoCliente', 'Oficina')} />
                <Wrench size={20} /> Oficina
              </label>
            </div>
            {formData.tipoCliente === 'Oficina' && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-orange-800 mb-1">Nome Oficina</label>
                  <input type="text" className="w-full p-2 border border-orange-300 rounded" value={formData.oficinaNome} onChange={e => handleChange('oficinaNome', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">Serviços / Foco</label>
                  <input type="text" className="w-full p-2 border border-orange-300 rounded" placeholder="Ex: Suspensão..." value={formData.oficinaFoco} onChange={e => handleChange('oficinaFoco', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <SectionTitle icon={Search} title="3. Oportunidade" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Peça *</label>
              <input type="text" className="w-full p-3 border rounded-lg" placeholder="Peça Procurada" value={formData.pecaProcurada} onChange={e => handleChange('pecaProcurada', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Veículo</label>
              <input type="text" className="w-full p-3 border rounded-lg" placeholder="Modelo/Ano" value={formData.veiculoModelo} onChange={e => handleChange('veiculoModelo', e.target.value)} />
            </div>
          </div>
          <div className="mb-4">
             <label className="block text-sm font-medium text-slate-700 mb-2">Origem</label>
             <SelectButton options={ORIGENS_CLIENTE} selected={formData.origem} onSelect={val => handleChange('origem', val)} />
          </div>

          <SectionTitle icon={DollarSign} title="4. Resultado" />
          <div className="flex gap-4 mb-6">
            <button type="button" onClick={() => handleChange('houveVenda', true)} className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${formData.houveVenda === true ? 'bg-green-600 border-green-600 text-white' : 'border-slate-200'}`}>
              <CheckCircle size={24} /> VENDA
            </button>
            <button type="button" onClick={() => handleChange('houveVenda', false)} className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${formData.houveVenda === false ? 'bg-red-600 border-red-600 text-white' : 'border-slate-200'}`}>
              <XCircle size={24} /> NÃO VENDEU
            </button>
          </div>

          {formData.houveVenda === true && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-6">
              <label className="block text-green-800 font-bold mb-2">Valor (R$)</label>
              <input type="text" className="w-full p-3 text-xl font-bold border-2 border-green-300 rounded-lg" placeholder="0,00" value={formData.valorVenda} onChange={handleCurrencyChange} />
            </div>
          )}

          {formData.houveVenda === false && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-6">
              <label className="block text-red-800 font-bold mb-3">Motivo Perda</label>
              <SelectButton options={MOTIVOS_PERDA} selected={formData.motivoPerda} onSelect={val => handleChange('motivoPerda', val)} />
              {formData.motivoPerda === 'Falta de Estoque' && (
                 <div className="mt-4">
                   <label className="block text-sm font-bold text-red-700 mb-1">Qual peça faltou?</label>
                   <input type="text" className="w-full p-2 border border-red-300 rounded" placeholder="Para compras..." value={formData.pecaFaltante} onChange={e => handleChange('pecaFaltante', e.target.value)} />
                 </div>
              )}
            </div>
          )}

          <SectionTitle icon={ClipboardList} title="Obs / Próximo Passo" />
          <textarea className="w-full p-3 border rounded-lg mb-6 h-24 resize-none" placeholder="Detalhes..." value={formData.observacoes} onChange={e => handleChange('observacoes', e.target.value)} />

          <button type="submit" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
            {loading ? '...' : <><Save className="w-6 h-6" /> SALVAR</>}
          </button>
        </form>

        {/* LISTAGEM RECENTE */}
        <div className="mt-10 mb-20">
          <h3 className="text-lg font-bold text-slate-600 mb-4 px-2">Recentes</h3>
          <div className="space-y-3">
            {recentOpps.map(opp => (
              <div key={opp.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-slate-300 flex justify-between items-center">
                 <div>
                    <p className="font-bold text-slate-800">{opp.clienteNome}</p>
                    <p className="text-xs text-slate-500">{opp.veiculoModelo} - {opp.pecaProcurada}</p>
                 </div>
                 <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${opp.houveVenda ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{opp.houveVenda ? 'VENDA' : 'PERDA'}</span>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}