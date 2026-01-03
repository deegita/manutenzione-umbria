import React, { useState } from 'react';
import { Role, User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email.toLowerCase() === 'mario@demo.it' && password === 'password') {
      onLogin({ name: 'Mario', role: Role.SEGNALATORE });
    } else if (email.toLowerCase() === 'luigi@demo.it' && password === 'admin') {
      onLogin({ name: 'Luigi', role: Role.OPERATORE });
    } else {
      setError('Credenziali errate.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      {/* Glass Card */}
      <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl max-w-md w-full p-8 relative z-10 border border-white/50">
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manutenzione<br/>Umbria</h1>
          <p className="text-slate-500 mt-2 font-medium">Accedi al portale segnalazioni</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1 group-focus-within:text-indigo-600 transition-colors">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none border"
              placeholder="nome@esempio.it"
            />
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1 group-focus-within:text-indigo-600 transition-colors">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none border pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                 {showPassword ? (
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.026m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                 ) : (
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                 )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-fadeIn">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-xl shadow-indigo-200 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 group"
          >
            <span>Accedi</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </form>

        {/* Stylish Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase text-center tracking-widest mb-4">Account Demo</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 transition-colors" onClick={() => { setEmail('mario@demo.it'); setPassword('password'); }}>
               <div className="flex items-center gap-2 mb-1">
                 <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                 <span className="font-bold text-xs text-slate-700">Segnalatore</span>
               </div>
               <div className="text-[10px] text-slate-500 font-mono">mario@demo.it</div>
            </div>
            <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:bg-emerald-50 hover:border-emerald-100 transition-colors" onClick={() => { setEmail('luigi@demo.it'); setPassword('admin'); }}>
               <div className="flex items-center gap-2 mb-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="font-bold text-xs text-slate-700">Operatore</span>
               </div>
               <div className="text-[10px] text-slate-500 font-mono">luigi@demo.it</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};