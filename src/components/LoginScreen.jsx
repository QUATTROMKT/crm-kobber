import React, { useState } from 'react';
import { Lock, Car } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onLogin(email, password);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden">

                {/* Efeitos de brilho */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-50 pointer-events-none"></div>

                <div className="bg-gradient-to-tr from-indigo-500 to-blue-400 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/50 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                    <Car className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Kobber CRM</h1>
                <p className="text-indigo-200 mb-8 font-medium">Autenticação de Acesso</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all group-hover:bg-white/10"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="relative group">
                        <input
                            type="password"
                            placeholder="Senha"
                            required
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all group-hover:bg-white/10"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <Lock className="absolute right-4 top-4 w-5 h-5 text-indigo-300 opacity-50" />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center"
                    >
                        {loading ? (
                            <span className="animate-pulse">Autenticando...</span>
                        ) : (
                            'ACESSAR SISTEMA'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
