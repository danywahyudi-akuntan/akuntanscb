import React, { useState } from 'react';
import { db, collection, addDoc, doc, setDoc } from '../lib/firebase';
import { Account, Budget } from '../types';
import { Settings, Plus, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  accounts: Account[];
  onInit: () => void;
}

export default function SettingsView({ accounts, onInit }: Props) {
  const [isInitializing, setIsInitializing] = useState(false);

  const handleInit = async () => {
    setIsInitializing(true);
    await onInit();
    setIsInitializing(false);
  };

  return (
    <div className="space-y-16 pb-20">
      <div className="flex flex-col gap-2 border-l-4 border-editorial-accent pl-6">
        <span className="editorial-label">System Configuration</span>
        <h1 className="editorial-h2 leading-none">Pengaturan & CoA</h1>
        <p className="font-serif italic text-editorial-secondary text-xl">Kelola bagan akun standar PSAK 109 dan kebijakan organisasi.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="editorial-card p-10 bg-white">
             <div className="flex items-center justify-between mb-10 border-b border-editorial-border pb-6">
                <h2 className="editorial-h3">Daftar Akun (Chart of Accounts)</h2>
                <button className="flex items-center gap-2 px-6 py-3 text-[9px] font-bold uppercase tracking-[0.3em] border border-editorial-border hover:bg-editorial-bg transition-all">
                  <Plus size={14} /> Add New Account
                </button>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="editorial-label text-[9px] text-editorial-secondary border-b border-editorial-text">
                      <th className="p-4 font-normal">Code</th>
                      <th className="p-4 font-normal">Account Description</th>
                      <th className="p-4 font-normal">Category</th>
                      <th className="p-4 font-normal">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-editorial-border">
                    {accounts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center font-serif italic text-editorial-secondary opacity-40">Belum ada akun yang terdaftar dalam buku besar.</td>
                      </tr>
                    ) : (
                      accounts.sort((a, b) => a.code.localeCompare(b.code)).map(acc => (
                        <tr key={acc.code} className="hover:bg-editorial-bg transition-all group">
                          <td className="p-4 editorial-mono font-bold group-hover:text-editorial-accent">{acc.code}</td>
                          <td className="p-4 font-serif italic text-sm">{acc.name}</td>
                          <td className="p-4">
                            <span className="editorial-label text-[8px] opacity-60 uppercase tracking-widest">{acc.category}</span>
                          </td>
                          <td className="p-4">
                             <span className="editorial-label text-[8px] border border-editorial-border px-3 py-1 uppercase tracking-widest">
                                {acc.fundType}
                             </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          </section>
        </div>

        <div className="space-y-12">
           <section className="bg-editorial-text text-editorial-bg p-10 border-t-4 border-editorial-accent">
              <h3 className="editorial-h3 text-white mb-6">Sistem & Master Data</h3>
              <p className="font-serif italic text-xs opacity-60 mb-10 leading-relaxed">
                Inisialisasi sistem akan memulihkan daftar akun standar Organisasi Pengelola Zakat (OPZ) sesuai regulasi terkini.
              </p>
              
              <button 
                onClick={handleInit}
                disabled={isInitializing}
                className="w-full flex items-center justify-center gap-3 py-4 border border-white/20 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-editorial-text transition-all disabled:opacity-30"
              >
                <RefreshCw size={14} className={isInitializing ? 'animate-spin' : ''} strokeWidth={2} />
                {accounts.length > 0 ? 'Resync Standar CoA' : 'Inisialisasi Akun'}
              </button>
              
              <div className="mt-10 pt-10 border-t border-white/10 flex items-center gap-4 text-emerald-400">
                 <ShieldCheck size={24} strokeWidth={1} />
                 <div>
                    <p className="editorial-mono text-[9px] font-bold uppercase tracking-widest leading-none mb-1">State: SECURE</p>
                    <p className="font-serif italic text-[10px] opacity-60">Audit Trail Active & Encrypted</p>
                 </div>
              </div>
           </section>

           <section className="editorial-card p-10 bg-white">
              <h3 className="editorial-h3 text-sm mb-6 uppercase tracking-widest">Data Retention Policy</h3>
              <div className="space-y-6">
                 <div className="p-5 bg-editorial-bg text-editorial-text border-l-2 border-editorial-accent font-serif italic text-xs leading-relaxed">
                    Dana Zakat dikelola terpisah dari Infaq dan Amil untuk menjaga kepatuhan syariah mutlak.
                 </div>
                 <div className="space-y-4 pt-6 border-t border-editorial-border">
                    {[
                      'Mandatory Double-Entry System',
                      'Real-time Financial Consolidation',
                      'UID-Linked Transaction History',
                      'Automated Budget Controls'
                    ].map(rule => (
                      <div key={rule} className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-editorial-secondary">
                        <div className="w-1.5 h-1.5 bg-editorial-accent"></div>
                        {rule}
                      </div>
                    ))}
                 </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
