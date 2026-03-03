import React from 'react';

export const SectionTitle = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-6 border-b pb-2 border-slate-200 mt-8">
        <div className="bg-indigo-100 p-1.5 rounded-lg">
            <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="font-extrabold text-slate-700 tracking-wide">{title}</h3>
    </div>
);

export const SelectButton = ({ selected, options, onSelect }) => (
    <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
            <button
                key={opt}
                type="button"
                onClick={() => onSelect(opt)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border ${selected === opt
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                    }`}
            >
                {opt}
            </button>
        ))}
    </div>
);

export const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
        <div className={`p-4 rounded-xl ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-7 h-7 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</p>
        </div>
    </div>
);
