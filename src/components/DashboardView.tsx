import React, { useState, useEffect } from 'react';
import { db, collection, getDocs } from '../lib/firebase';
import { Account, JournalEntry } from '../types';
import { Landmark, TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  accounts: Account[];
}

export default function DashboardView({ accounts }: Props) {
  const [stats, setStats] = useState({
    zakatBalance: 0,
    infaqBalance: 0,
    amilBalance: 0,
    totalExpenses: 0,
  });

  useEffect(() => {
    fetchBalances();
  }, [accounts]);

  const fetchBalances = async () => {
    // In a real app, this should be a cloud function or an aggregate table
    // For this demo, we'll fetch entries and calculate
    const transactionsSnap = await getDocs(collection(db, 'transactions'));
    let zBal = 0, iBal = 0, aBal = 0, exp = 0;

    for (const tDoc of transactionsSnap.docs) {
      const entriesSnap = await getDocs(collection(db, `transactions/${tDoc.id}/entries`));
      entriesSnap.forEach(e => {
        const data = e.data() as JournalEntry;
        const acc = accounts.find(a => a.id === data.accountId || a.code === data.accountCode);
        
        if (acc) {
          const amount = data.debit - data.credit;
          if (acc.fundType === 'Zakat') {
            if (acc.category === 'Asset') zBal += amount;
            if (acc.category === 'Expense') exp += data.debit;
          }
          if (acc.fundType === 'Infaq') {
            if (acc.category === 'Asset') iBal += amount;
            if (acc.category === 'Expense') exp += data.debit;
          }
          if (acc.fundType === 'Amil') {
            if (acc.category === 'Asset') aBal += amount;
          }
          if (acc.category === 'Expense' && acc.fundType === 'General') {
            exp += data.debit;
          }
        }
      });
    }

    setStats({
      zakatBalance: zBal,
      infaqBalance: iBal,
      amilBalance: aBal,
      totalExpenses: exp
    });
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  };

  const widgets = [
    { label: 'Saldo Dana Zakat', value: stats.zakatBalance, icon: Landmark, color: 'text-indigo-600' },
    { label: 'Saldo Dana Infaq', value: stats.infaqBalance, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Saldo Dana Amil', value: stats.amilBalance, icon: Users, color: 'text-amber-600' },
    { label: 'Total Pengeluaran', value: stats.totalExpenses, icon: TrendingDown, color: 'text-rose-600' },
  ];

  return (
    <div className="space-y-12 pb-12">
      <div className="flex flex-col gap-2 border-l-4 border-editorial-accent pl-6">
        <span className="editorial-label">Financial Overview</span>
        <h1 className="editorial-h2 leading-none">Ringkasan Keuangan</h1>
        <p className="font-serif italic text-editorial-secondary">Ikhtisar posisi dana ZISWAF dan operasional sekolah.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-editorial-border">
        {widgets.map((w, i) => (
          <motion.div
            key={w.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`p-8 bg-white border-r border-editorial-border last:border-r-0 hover:bg-editorial-bg transition-all group`}
          >
            <div className="flex items-center justify-between mb-8">
              <w.icon size={20} className={`${w.color}`} strokeWidth={1.5} />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-editorial-secondary">Audit Trail</span>
            </div>
            <p className="editorial-label text-[9px] mb-2">{w.label}</p>
            <p className="text-2xl editorial-mono font-medium">{formatIDR(w.value)}</p>
            <div className="w-0 group-hover:w-full h-[1px] bg-editorial-accent mt-4 transition-all duration-500"></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
        <div className="lg:col-span-7 editorial-card">
          <div className="flex justify-between items-baseline mb-8">
            <h3 className="editorial-h3">Alur Kas Terakhir</h3>
            <span className="editorial-label text-[9px]">Live Data</span>
          </div>
          <div className="space-y-0 border-t border-editorial-text">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between py-5 border-b border-editorial-border hover:bg-editorial-bg px-2 transition-all">
                <div className="flex gap-4 items-center">
                  <span className="editorial-mono text-[10px] text-editorial-secondary">1{i}/05</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest">Penerimaan Zakat Mal</p>
                    <p className="editorial-mono text-[10px] text-editorial-secondary opacity-60">REF: J-240500{i}</p>
                  </div>
                </div>
                <p className="editorial-mono font-bold text-sm text-emerald-600">+ {formatIDR(2500000)}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 text-[10px] font-bold uppercase tracking-[0.3em] border border-editorial-text hover:bg-editorial-text hover:text-white transition-all">
            Lihat Semua Transaksi
          </button>
        </div>

        <div className="lg:col-span-5 bg-editorial-text text-editorial-bg p-10 flex flex-col">
          <h3 className="editorial-h3 text-white mb-10">Kontrol Anggaran</h3>
          <div className="space-y-10 flex-1">
            {[
              { label: 'Program Beasiswa Tahfidz', val: 75, color: 'bg-emerald-400' },
              { label: 'Gaji & Honorarium', val: 45, color: 'bg-editorial-accent' },
              { label: 'Operasional Sekolah', val: 92, color: 'bg-rose-400' }
            ].map((prog) => (
              <div key={prog.label}>
                <div className="flex justify-between editorial-mono text-[10px] mb-2 uppercase tracking-widest opacity-80">
                  <span>{prog.label}</span>
                  <span>{prog.val}%</span>
                </div>
                <div className="h-[2px] bg-white/10 overflow-hidden">
                  <div className={`h-full ${prog.color}`} style={{ width: `${prog.val}%` }}></div>
                </div>
                <p className={`text-[9px] mt-2 italic ${prog.val > 90 ? 'text-rose-400 font-bold' : 'opacity-40'}`}>
                  {prog.val > 90 ? 'Peringatan: Anggaran Tipis' : `Sisa: ${formatIDR(1500000)}`}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
             <p className="editorial-label text-white/40 mb-2">Accounting Policy</p>
             <p className="font-serif italic text-xs opacity-60">Dana Zakat disalurkan sesuai 8 Asnaf PSAK 109.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
