import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, orderBy, Timestamp } from '../lib/firebase';
import { Transaction, JournalEntry, Account } from '../types';
import { Search, ChevronDown, ChevronUp, FileText, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface Props {
  accounts: Account[];
}

interface TransactionWithEntries extends Transaction {
  entries: JournalEntry[];
  isOpen?: boolean;
}

export default function TransactionHistoryView({ accounts }: Props) {
  const [transactions, setTransactions] = useState<TransactionWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const txs: TransactionWithEntries[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as AppTransaction;
        // Fetch sub-entries
        const entriesSnap = await getDocs(collection(db, `transactions/${docSnap.id}/entries`));
        const entries = entriesSnap.docs.map(e => e.data() as JournalEntry);
        txs.push({ ...data, id: docSnap.id, entries, isOpen: false });
      }
      setTransactions(txs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = (id: string) => {
    setTransactions(transactions.map(tx => 
      tx.id === id ? { ...tx, isOpen: !tx.isOpen } : tx
    ));
  };

  const filtered = transactions.filter(tx => 
    tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  };

  if (loading) {
    return <div className="flex justify-center p-20">Memuat riwayat transaksi...</div>;
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-editorial-text pb-6">
        <div className="flex flex-col gap-2">
          <span className="editorial-label">Financial Archives</span>
          <h1 className="editorial-h2 leading-none">Riwayat Transaksi</h1>
          <p className="font-serif italic text-editorial-secondary text-lg">Daftar Jurnal Umum yang telah tercatat dalam sistem.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-editorial-secondary group-focus-within:text-editorial-accent transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Cari deskripsi atau referensi..."
            className="pl-12 pr-6 py-4 bg-white border border-editorial-border focus:border-editorial-text focus:ring-0 outline-none w-full md:w-80 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-24 text-center editorial-card flex flex-col items-center gap-4">
            <div className="w-12 h-[1px] bg-editorial-border"></div>
            <p className="font-serif italic text-editorial-secondary">Tidak ada transaksi ditemukan dalam arsip.</p>
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id} className="editorial-card p-0 group overflow-hidden hover:border-editorial-accent transition-all duration-300">
              <div 
                className="p-8 flex flex-wrap items-center justify-between gap-6 cursor-pointer bg-white"
                onClick={() => toggleOpen(tx.id!)}
              >
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center">
                    <span className="editorial-mono text-xl font-bold leading-none">{format(new Date(tx.date), 'dd')}</span>
                    <span className="editorial-label text-[8px] tracking-[0.2em]">{format(new Date(tx.date), 'MMM')}</span>
                  </div>
                  <div className="h-10 w-[1px] bg-editorial-border"></div>
                  <div>
                    <p className="editorial-label text-[9px] mb-1">
                      {tx.reference || 'Arsip Manual'} &bull; ID: {tx.id?.slice(-8).toUpperCase()}
                    </p>
                    <h3 className="text-lg font-serif italic tracking-tight">{tx.description}</h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="editorial-label text-[9px] mb-1">Nominal</p>
                    <p className="editorial-mono font-bold text-lg">{formatIDR(tx.total)}</p>
                  </div>
                  <div className={`p-2 transition-transform duration-500 ${tx.isOpen ? 'rotate-180 text-editorial-accent' : 'text-editorial-secondary'}`}>
                    <ChevronDown size={20} strokeWidth={1} />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {tx.isOpen && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-editorial-bg"
                  >
                    <div className="p-8 space-y-6">
                       <div className="flex justify-between items-center px-4">
                          <span className="editorial-label text-[8px]">Double-Entry Ledger Items</span>
                          <div className="h-[1px] flex-1 mx-8 bg-editorial-border"></div>
                       </div>
                       <table className="w-full text-xs">
                         <thead>
                           <tr className="text-left font-serif italic text-editorial-secondary border-b border-editorial-border">
                             <th className="py-3 px-4 font-normal">Acc. Code</th>
                             <th className="py-3 px-4 font-normal">Account Name</th>
                             <th className="py-3 px-4 font-normal">Classification</th>
                             <th className="py-3 px-4 font-normal text-right">Debit</th>
                             <th className="py-3 px-4 font-normal text-right">Kredit</th>
                           </tr>
                         </thead>
                         <tbody className="bg-white">
                           {tx.entries.map((entry, idx) => (
                             <tr key={idx} className="border-b border-editorial-border hover:bg-editorial-bg/50 transition-colors">
                               <td className="py-4 px-4 editorial-mono font-bold">{entry.accountCode}</td>
                               <td className="py-4 px-4 font-serif italic text-sm">{entry.accountName}</td>
                               <td className="py-4 px-4">
                                 <span className="editorial-label text-[8px] border border-editorial-border px-2 py-1">
                                   {entry.fundType}
                                 </span>
                               </td>
                               <td className="py-4 px-4 text-right editorial-mono font-medium">{entry.debit > 0 ? formatIDR(entry.debit) : '—'}</td>
                               <td className="py-4 px-4 text-right editorial-mono font-medium">{entry.credit > 0 ? formatIDR(entry.credit) : '—'}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                       <div className="pt-6 flex justify-end gap-4 p-4">
                         <button className="flex items-center gap-2 px-6 py-2 text-[9px] font-bold uppercase tracking-[0.3em] border border-editorial-text hover:bg-editorial-text hover:text-white transition-all">
                           <FileText size={14} strokeWidth={1} /> Cetak Slip Jurnal
                         </button>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
