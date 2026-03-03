import React, { useState } from 'react';
import { Wand2, X } from 'lucide-react';
import { parseMagicText } from '../utils/aiParser';

export default function SmartPaste({ onParse }) {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');

    const handleParse = () => {
        if (!text.trim()) return;

        // Simula um pequeno tempo de carregamento para efeito visual
        const parsedData = parseMagicText(text);

        if (parsedData && onParse) {
            onParse(parsedData);
            setIsOpen(false);
            setText('');
        }
    };

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="w-full mb-6 relative overflow-hidden group bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 border border-indigo-400"
            >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <Wand2 className="w-5 h-5 animate-pulse text-yellow-300" />
                <span className="font-bold tracking-wide relative z-10">Magic Paste: Preenchimento Automático</span>
            </button>
        );
    }

    return (
        <div className="mb-6 bg-white rounded-xl shadow-xl overflow-hidden border border-indigo-100 animate-fade-in ring-4 ring-indigo-50/50">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-800 font-bold">
                    <Wand2 className="w-5 h-5 text-indigo-600" />
                    Mágica em Ação
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-red-500 transition-colors bg-white rounded-full p-1"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4">
                <p className="text-xs text-slate-500 mb-2">
                    Cole abaixo a mensagem do WhatsApp, o e-mail ou a anotação bruta.
                    O sistema extrairá os dados automaticamente.
                </p>
                <textarea
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ex: Fala Kadu! Aqui da oficina do Tiago Motos de Santa Maria, tô precisando de bateria pruma XRE 300, como tá de preço?"
                    className="w-full h-24 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm text-slate-700 bg-slate-50 focus:bg-white transition-colors"
                />

                <div className="mt-3 flex justify-end gap-2">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleParse}
                        disabled={!text.trim()}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Wand2 className="w-4 h-4" />
                        Extrair Dados!
                    </button>
                </div>
            </div>
        </div>
    );
}
