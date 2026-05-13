import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, orderBy } from '../lib/firebase';
import { Account, JournalEntry, FundType } from '../types';
import { Download, Printer, Filter, PieChart, BarChart3, Landmark } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  accounts: Account[];
}

interface FundReport {
  revenue: number;
  expense: number;
  surplus: number;
}

export default function ReportsView({ accounts }: Props) {
  const [reportType, setReportType] = useState<'activity' | 'balance' | 'cash'>('activity');
  const [loading, setLoading] = useState(false);
  const [activityReport, setActivityReport] = useState<Record<FundType, FundReport> & { Total: FundReport }>({
    Zakat: { revenue: 0, expense: 0, surplus: 0 },
    Infaq: { revenue: 0, expense: 0, surplus: 0 },
    Amil: { revenue: 0, expense: 0, surplus: 0 },
    General: { revenue: 0, expense: 0, surplus: 0 },
    Total: { revenue: 0, expense: 0, surplus: 0 }
  });

  const [balanceSheet, setBalanceSheet] = useState<{
    Assets: Record<string, number>,
    Liabilities: Record<string, number>,
    NetAssets: Record<string, number>,
    TotalAssets: number,
    TotalLiabNet: number
  }>({
    Assets: {},
    Liabilities: {},
    NetAssets: {},
    TotalAssets: 0,
    TotalLiabNet: 0
  });

  useEffect(() => {
    generateReports();
  }, [accounts]);

  const generateReports = async () => {
    setLoading(true);
    try {
      const transactionsSnap = await getDocs(collection(db, 'transactions'));
      
      const newActivity: any = {
        Zakat: { revenue: 0, expense: 0 },
        Infaq: { revenue: 0, expense: 0 },
        Amil: { revenue: 0, expense: 0 },
        General: { revenue: 0, expense: 0 }
      };

      const newBalance: any = {
        Assets: {},
        Liabilities: {},
        NetAssets: {}
      };

      for (const tDoc of transactionsSnap.docs) {
        const entriesSnap = await getDocs(collection(db, `transactions/${tDoc.id}/entries`));
        entriesSnap.forEach(eDoc => {
          const entry = eDoc.data() as JournalEntry;
          const account = accounts.find(a => a.id === entry.accountId || a.code === entry.accountCode);
          
          if (account) {
            // Activity Logic (Revenue & Expense)
            if (account.category === 'Revenue') {
              newActivity[account.fundType].revenue += entry.credit - entry.debit;
            } else if (account.category === 'Expense') {
              newActivity[account.fundType].expense += entry.debit - entry.credit;
            }

            // Balance Sheet Logic (Asset, Liability, Net Asset)
            const balance = entry.debit - entry.credit;
            if (account.category === 'Asset') {
              newBalance.Assets[account.name] = (newBalance.Assets[account.name] || 0) + balance;
            } else if (account.category === 'Liability') {
              // Liabilities usually have credit balance
              newBalance.Liabilities[account.name] = (newBalance.Liabilities[account.name] || 0) + (entry.credit - entry.debit);
            } else if (account.category === 'NetAsset') {
              newBalance.NetAssets[account.name] = (newBalance.NetAssets[account.name] || 0) + (entry.credit - entry.debit);
            }
          }
        });
      }

      // Calculate totals and surplus for Activity
      let totalRev = 0, totalExp = 0;
      Object.keys(newActivity).forEach(k => {
        const key = k as FundType;
        newActivity[key].surplus = newActivity[key].revenue - newActivity[key].expense;
        totalRev += newActivity[key].revenue;
        totalExp += newActivity[key].expense;
      });
      newActivity.Total = { revenue: totalRev, expense: totalExp, surplus: totalRev - totalExp };

      // Calculate totals for Balance Sheet
      const totalAssets = Object.values(newBalance.Assets).reduce((a: any, b: any) => a + b, 0) as number;
      const totalLiab = Object.values(newBalance.Liabilities).reduce((a: any, b: any) => a + b, 0) as number;
      const totalNet = Object.values(newBalance.NetAssets).reduce((a: any, b: any) => a + b, 0) as number;
      
      setActivityReport(newActivity);
      setBalanceSheet({
        ...newBalance,
        TotalAssets: totalAssets,
        TotalLiabNet: totalLiab + totalNet + (totalRev - totalExp) // Add surplus to net assets (Retained earnings style)
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-editorial-text pb-8">
        <div className="flex flex-col gap-2">
          <span className="editorial-label">Financial Statements</span>
          <h1 className="editorial-h2 leading-none">
            {reportType === 'activity' ? 'Laporan Aktivitas' : 'Posisi Keuangan'}
          </h1>
          <p className="font-serif italic text-editorial-secondary text-lg">Periode pelaporan berjalan sesuai PSAK 109.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-3 px-8 py-4 text-[10px] font-bold uppercase tracking-[0.3em] border border-editorial-border hover:bg-editorial-bg transition-all">
            <Download size={14} /> Export CSV
          </button>
          <button className="flex items-center gap-3 px-8 py-4 bg-editorial-text text-editorial-bg text-[10px] font-bold uppercase tracking-[0.3em] border border-editorial-text hover:bg-white hover:text-editorial-text transition-all">
            <Printer size={14} /> Print PDF
          </button>
        </div>
      </div>

      {/* Report Switcher */}
      <div className="flex border-b border-editorial-border">
        <button 
          onClick={() => setReportType('activity')}
          className={`px-10 py-5 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border-b-2 ${
            reportType === 'activity' 
              ? 'border-editorial-accent text-editorial-text bg-white' 
              : 'border-transparent text-editorial-secondary hover:text-editorial-text'
          }`}
        >
          Laporan Aktivitas
        </button>
        <button 
          onClick={() => setReportType('balance')}
          className={`px-10 py-5 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border-b-2 ${
            reportType === 'balance' 
              ? 'border-editorial-accent text-editorial-text bg-white' 
              : 'border-transparent text-editorial-secondary hover:text-editorial-text'
          }`}
        >
          Neraca (SOP)
        </button>
      </div>

      {loading ? (
        <div className="p-32 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-[1px] bg-editorial-border animate-pulse"></div>
          <p className="font-serif italic text-editorial-secondary">Menghitung data laporan dari buku besar...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-12"
        >
          {reportType === 'activity' ? (
            <div className="editorial-card p-12 bg-white max-w-4xl mx-auto w-full shadow-[16px_16px_0px_0px_#F0EFED]">
              <div className="text-center mb-16 border-b border-editorial-border pb-12">
                <span className="editorial-label text-[10px] mb-4 block">Accounting Report v2.4</span>
                <h2 className="text-4xl font-serif italic mb-2 tracking-tight">Laporan Aktivitas</h2>
                <div className="editorial-label opacity-40 text-[9px] uppercase tracking-[0.4em]">Periode Berakhir 31 Des 2024</div>
              </div>
              
              <div className="space-y-20">
                {/* Penerimaan */}
                <section>
                  <div className="flex items-center gap-4 mb-8">
                     <h3 className="editorial-label text-emerald-600 font-bold">I. Penerimaan & Pendapatan</h3>
                     <div className="flex-1 h-[1px] bg-editorial-border opacity-30"></div>
                  </div>
                  <div className="space-y-6">
                    {[
                      { label: 'Penerimaan Zakat (Zakat Mal/Profesi)', val: activityReport.Zakat.revenue },
                      { label: 'Dana Infaq & Sadaqah (Terikat/Tidak Terikat)', val: activityReport.Infaq.revenue },
                      { label: 'Dana Pengelola (Amil)', val: activityReport.Amil.revenue },
                      { label: 'Operasional Pendidikan & Komersial', val: activityReport.General.revenue }
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-baseline group">
                        <span className="font-serif italic text-lg text-editorial-text">{item.label}</span>
                        <div className="flex-1 mx-4 border-b border-dotted border-editorial-border opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="editorial-mono font-bold text-lg">{formatIDR(item.val)}</span>
                      </div>
                    ))}
                    <div className="pt-8 border-t-2 border-editorial-text flex justify-between editorial-h3 text-2xl">
                      <span>Total Penerimaan Bruto</span>
                      <span className="underline decoration-double underline-offset-4">{formatIDR(activityReport.Total.revenue)}</span>
                    </div>
                  </div>
                </section>

                {/* Penyaluran & Beban */}
                <section>
                  <div className="flex items-center gap-4 mb-8">
                     <h3 className="editorial-label text-rose-600 font-bold">II. Penyaluran & Beban</h3>
                     <div className="flex-1 h-[1px] bg-editorial-border opacity-30"></div>
                  </div>
                  <div className="space-y-6">
                    {[
                      { label: 'Penyaluran Dana Zakat Berbasis Program', val: activityReport.Zakat.expense },
                      { label: 'Hibah Infaq & Penyaluran Sosial', val: activityReport.Infaq.expense },
                      { label: 'Beban Operasional Amil', val: activityReport.Amil.expense },
                      { label: 'Beban Pokok Operasional Sekolah', val: activityReport.General.expense }
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-baseline group">
                        <span className="font-serif italic text-lg text-editorial-text">{item.label}</span>
                        <div className="flex-1 mx-4 border-b border-dotted border-editorial-border opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="editorial-mono font-bold text-lg text-rose-600">({formatIDR(item.val)})</span>
                      </div>
                    ))}
                    <div className="pt-8 border-t-2 border-editorial-text flex justify-between editorial-h3 text-2xl">
                      <span>Total Pengeluaran</span>
                      <span className="text-rose-600 underline decoration-double underline-offset-4">({formatIDR(activityReport.Total.expense)})</span>
                    </div>
                  </div>
                </section>

                {/* Surplus/Defisit */}
                <section className="bg-editorial-text text-editorial-bg p-12 -mx-12 -mb-12">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                      <h4 className="editorial-label text-white/40 mb-2">Net Financial Result</h4>
                      <p className="text-3xl font-serif italic text-emerald-400">Pernyataan Surplus/Defisit</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl editorial-mono font-bold">{formatIDR(activityReport.Total.surplus)}</p>
                      <div className="h-1 w-12 bg-editorial-accent ml-auto mt-4"></div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto w-full">
               {/* Assets */}
               <div className="editorial-card p-12 bg-white flex flex-col h-full border-t-4 border-editorial-text">
                 <div className="flex justify-between items-center mb-12">
                   <h3 className="editorial-h3 text-xl">ASSET (AKTIVA)</h3>
                   <Landmark size={24} strokeWidth={1} viewBox="0 0 24 24" className="text-editorial-accent" />
                 </div>
                 <div className="space-y-6 flex-1">
                   {Object.entries(balanceSheet.Assets).map(([name, val]) => (
                     <div key={name} className="flex justify-between items-baseline group">
                       <span className="font-serif italic text-lg text-editorial-text">{name}</span>
                       <div className="flex-1 mx-4 border-b border-dotted border-editorial-border"></div>
                       <span className="editorial-mono font-bold">{formatIDR(val as number)}</span>
                     </div>
                   ))}
                 </div>
                 <div className="mt-16 pt-8 border-t-2 border-editorial-text flex justify-between editorial-h3 text-2xl">
                   <span>Total Asset</span>
                   <span className="underline decoration-double underline-offset-4">{formatIDR(balanceSheet.TotalAssets)}</span>
                 </div>
               </div>

               {/* Liab & Net Assets */}
               <div className="editorial-card p-12 bg-white flex flex-col h-full border-t-4 border-editorial-accent">
                 <div className="flex justify-between items-center mb-12">
                   <h3 className="editorial-h3 text-xl">LIABILITAS & DANA</h3>
                   <PieChart size={24} strokeWidth={1} className="text-editorial-text" />
                 </div>
                 <div className="space-y-10 flex-1">
                   <div className="space-y-6">
                     <p className="editorial-label text-rose-600 font-bold border-b border-rose-100 pb-2 mb-4">Liabilitas Jangka Pendek</p>
                     {Object.entries(balanceSheet.Liabilities).map(([name, val]) => (
                       <div key={name} className="flex justify-between items-baseline group">
                         <span className="font-serif italic text-lg text-editorial-text">{name}</span>
                         <div className="flex-1 mx-4 border-b border-dotted border-editorial-border"></div>
                         <span className="editorial-mono font-bold">{formatIDR(val as number)}</span>
                       </div>
                     ))}
                   </div>
                   
                   <div className="space-y-6">
                     <p className="editorial-label text-emerald-600 font-bold border-b border-emerald-100 pb-2 mb-4">Saldo Dana (Net Assets)</p>
                     {Object.entries(balanceSheet.NetAssets).map(([name, val]) => (
                       <div key={name} className="flex justify-between items-baseline group">
                         <span className="font-serif italic text-lg text-editorial-text">{name}</span>
                         <div className="flex-1 mx-4 border-b border-dotted border-editorial-border"></div>
                         <span className="editorial-mono font-bold">{formatIDR(val as number)}</span>
                       </div>
                     ))}
                     <div className="flex justify-between items-baseline text-emerald-600 animate-pulse border border-emerald-100 p-4 bg-emerald-50/30">
                       <span className="font-serif italic font-bold">Surplus Berjalan</span>
                       <span className="editorial-mono font-bold text-lg">{formatIDR(activityReport.Total.surplus)}</span>
                     </div>
                   </div>
                 </div>
                 <div className="mt-16 pt-8 border-t-2 border-editorial-text flex justify-between editorial-h3 text-2xl">
                   <span>Total Pasiva</span>
                   <span className="underline decoration-double underline-offset-4">{formatIDR(balanceSheet.TotalLiabNet)}</span>
                 </div>
               </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
