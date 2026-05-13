import React, { useState } from 'react';
import { db, collection, addDoc, doc, writeBatch, Timestamp } from '../lib/firebase';
import { Account, JournalEntry, Transaction as AppTransaction } from '../types';
import { User } from 'firebase/auth';
import { Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface Props {
  accounts: Account[];
  user: User;
  onComplete: () => void;
}

interface DraftEntry {
  accountId: string;
  debit: number;
  credit: number;
}

export default function JournalFormView({ accounts, user, onComplete }: Props) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [entries, setEntries] = useState<DraftEntry[]>([
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 },
  ]);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addEntry = () => {
    setEntries([...entries, { accountId: '', debit: 0, credit: 0 }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 2) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof DraftEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setStatus({ type: 'error', message: 'Total Debit dan Kredit harus seimbang dan lebih dari 0!' });
      return;
    }

    if (!description) {
      setStatus({ type: 'error', message: 'Keterangan harus diisi!' });
      return;
    }

    if (entries.some(e => !e.accountId)) {
      setStatus({ type: 'error', message: 'Semua baris harus memiliki akun!' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: 'Menyimpan transaksi...' });

    try {
      const batch = writeBatch(db);
      
      const transactionRef = doc(collection(db, 'transactions'));
      const transactionData: AppTransaction = {
        date,
        description,
        reference,
        total: totalDebit,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      batch.set(transactionRef, transactionData);

      entries.forEach((e) => {
        const account = accounts.find(a => a.id === e.accountId || a.code === e.accountId);
        const entryRef = doc(collection(db, `transactions/${transactionRef.id}/entries`));
        const entryData: JournalEntry = {
          transactionId: transactionRef.id,
          accountId: e.accountId,
          accountName: account?.name || '',
          accountCode: account?.code || '',
          debit: Number(e.debit || 0),
          credit: Number(e.credit || 0),
          fundType: account?.fundType || 'General',
          date,
        };
        batch.set(entryRef, entryData);
      });

      await batch.commit();
      setStatus({ type: 'success', message: 'Transaksi berhasil disimpan!' });
      setTimeout(() => onComplete(), 1500);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Gagal menyimpan transaksi. Cek koneksi atau izin.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col gap-2 border-l-4 border-editorial-accent pl-6">
        <span className="editorial-label">Data Entry</span>
        <h1 className="editorial-h2 leading-none">Input Jurnal Umum</h1>
        <p className="font-serif italic text-editorial-secondary">Entri transaksi keuangan dengan sistem double-entry accounting.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-editorial-border bg-white">
          <div className="p-6 border-r border-editorial-border group">
            <label className="editorial-label text-[9px] mb-2 block group-focus-within:text-editorial-accent transition-colors">Tanggal Transaksi</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-0 bg-transparent border-none focus:ring-0 editorial-mono font-medium text-lg"
              required
            />
          </div>
          <div className="md:col-span-2 p-6 group">
            <label className="editorial-label text-[9px] mb-2 block group-focus-within:text-editorial-accent transition-colors">Keterangan / Deskripsi</label>
            <input 
              type="text" 
              placeholder="Contoh: Penerimaan Zakat Mal Bapak Budi"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-0 bg-transparent border-none focus:ring-0 font-serif italic text-xl placeholder:opacity-30"
              required
            />
          </div>
          <div className="md:col-span-3 p-6 border-t border-editorial-border group">
            <label className="editorial-label text-[9px] mb-2 block group-focus-within:text-editorial-accent transition-colors">Referensi / No. Dokumen</label>
            <input 
              type="text" 
              placeholder="Ref: 001/ZAK/05/2024"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full p-0 bg-transparent border-none focus:ring-0 editorial-mono text-sm uppercase tracking-widest placeholder:opacity-30"
            />
          </div>
        </div>

        <div className="bg-white border border-editorial-border overflow-hidden shadow-[12px_12px_0px_0px_#F0EFED]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-editorial-text text-editorial-bg">
                <th className="p-5 text-left editorial-label text-editorial-bg/60 w-1/2">Akun</th>
                <th className="p-5 text-right editorial-label text-editorial-bg/60">Debit</th>
                <th className="p-5 text-right editorial-label text-editorial-bg/60">Kredit</th>
                <th className="p-5 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-editorial-border">
              {entries.map((entry, index) => (
                <tr key={index} className="hover:bg-editorial-bg transition-colors">
                  <td className="p-3">
                    <select 
                      value={entry.accountId}
                      onChange={(e) => updateEntry(index, 'accountId', e.target.value)}
                      className="w-full p-2 bg-transparent border-none focus:ring-0 text-xs font-bold uppercase tracking-widest appearance-none cursor-pointer"
                    >
                      <option value="">Pilih Akun...</option>
                      {accounts.map(acc => (
                        <option key={acc.id || acc.code} value={acc.id || acc.code}>
                          [{acc.code}] {acc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <input 
                      type="number" 
                      value={entry.debit || ''}
                      onChange={(e) => updateEntry(index, 'debit', Number(e.target.value))}
                      className="w-full p-2 text-right bg-transparent border-none focus:ring-0 editorial-mono font-bold"
                      placeholder="0"
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      type="number" 
                      value={entry.credit || ''}
                      onChange={(e) => updateEntry(index, 'credit', Number(e.target.value))}
                      className="w-full p-2 text-right bg-transparent border-none focus:ring-0 editorial-mono font-bold"
                      placeholder="0"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      type="button" 
                      onClick={() => removeEntry(index)}
                      className="text-editorial-secondary hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-editorial-bg font-bold border-t border-editorial-text">
                <td className="p-6 editorial-h3 text-lg">Total Balance</td>
                <td className="p-6 text-right editorial-mono text-lg">{totalDebit.toLocaleString()}</td>
                <td className="p-6 text-right editorial-mono text-lg">{totalCredit.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          
          <div className="p-6 border-t border-editorial-border bg-white flex justify-between items-center">
            <button 
              type="button" 
              onClick={addEntry}
              className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.3em] border border-editorial-border hover:border-editorial-text transition-all"
            >
              <Plus size={14} /> Add Line Item
            </button>
            <div className={`text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 border ${isBalanced ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {isBalanced ? 'Journal Balanced' : 'Out of Balance'}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {status.type !== 'idle' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 flex items-center gap-4 text-xs font-medium border-l-4 ${
                status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-500' : 'bg-rose-50 text-rose-800 border-rose-500'
              }`}
            >
              {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end gap-6 pt-10 border-t border-editorial-border">
          <button 
            type="button"
            className="px-10 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-editorial-secondary hover:text-editorial-text transition-all disabled:opacity-50"
            disabled={isSubmitting}
            onClick={() => onComplete()}
          >
            Cancel Entry
          </button>
          <button 
            type="submit"
            className="flex items-center gap-3 px-12 py-4 bg-editorial-text text-editorial-bg text-[10px] font-bold uppercase tracking-[0.3em] border border-editorial-text hover:bg-white hover:text-editorial-text transition-all disabled:opacity-50"
            disabled={isSubmitting || !isBalanced}
          >
            <Save size={18} strokeWidth={1.5} />
            {isSubmitting ? 'Processing...' : 'Confirm Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
