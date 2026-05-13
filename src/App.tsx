import React, { useState, useEffect } from 'react';
import { 
  auth, 
  loginWithGoogle, 
  logout, 
  db, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy
} from './lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { INITIAL_COA, Account, Transaction as AppTransaction, Budget } from './types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Wallet,
  TrendingDown,
  TrendingUp,
  Landmark,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardView from './components/DashboardView';
import JournalFormView from './components/JournalFormView';
import TransactionHistoryView from './components/TransactionHistoryView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'accounts'), (snapshot) => {
      const accData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Account));
      setAccounts(accData);
    });
    return () => unsubscribe();
  }, [user]);

  const initCoA = async () => {
    for (const acc of INITIAL_COA) {
      await setDoc(doc(db, 'accounts', acc.code), acc);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-editorial-bg">
        <div className="w-12 h-[1px] bg-editorial-text animate-pulse"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-editorial-bg p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]">
        <Landmark size={48} className="mb-8 text-editorial-accent" strokeWidth={1} />
        <span className="editorial-label mb-4">Accounting Information System</span>
        <h1 className="editorial-h1 mb-8">Mizan Syariah</h1>
        <p className="font-serif italic text-lg text-editorial-secondary mb-12 max-w-sm">Pengelolaan Dana ZISWAF & Operasional Sekolah yang Akuntabel.</p>
        <button 
          onClick={loginWithGoogle}
          className="px-12 py-4 border border-editorial-text hover:bg-editorial-text hover:text-editorial-bg transition-all text-xs uppercase tracking-[0.3em] font-bold"
        >
          Masuk dengan Google
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView accounts={accounts} />;
      case 'journal': return <JournalFormView accounts={accounts} user={user} onComplete={() => setActiveTab('history')} />;
      case 'history': return <TransactionHistoryView accounts={accounts} />;
      case 'reports': return <ReportsView accounts={accounts} />;
      case 'settings': return <SettingsView accounts={accounts} onInit={initCoA} />;
      default: return <DashboardView accounts={accounts} />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'journal', label: 'Jurnal Umum', icon: PlusCircle },
    { id: 'history', label: 'Riwayat', icon: FileText },
    { id: 'reports', label: 'Laporan', icon: PieChart },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-editorial-bg text-editorial-text font-sans">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-editorial-border flex flex-col z-50 bg-white"
          >
            <div className="p-8 border-b border-editorial-border">
              <span className="editorial-label mb-2 block">SIA-ZISWAF</span>
              <h1 className="text-3xl font-serif italic tracking-tight">Mizan System</h1>
            </div>
            
            <nav className="flex-1 py-8 px-4 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b border-transparent hover:border-editorial-accent ${
                    activeTab === item.id 
                      ? 'text-editorial-text bg-editorial-bg' 
                      : 'text-editorial-secondary hover:text-editorial-text'
                  }`}
                >
                  <span className="flex items-center gap-4">
                    <item.icon size={16} strokeWidth={1.5} />
                    {item.label}
                  </span>
                  {activeTab === item.id && <div className="w-1.5 h-1.5 bg-editorial-accent"></div>}
                </button>
              ))}
            </nav>

            <div className="p-8 border-t border-editorial-border">
              <div className="flex items-center gap-4 mb-8">
                <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-none border border-editorial-border grayscale hover:grayscale-0 transition-all" />
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-widest truncate">{user.displayName}</p>
                  <p className="text-[9px] text-editorial-secondary italic truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 py-3 text-[10px] uppercase tracking-widest font-bold border border-editorial-border hover:bg-editorial-text hover:text-editorial-bg transition-all"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-sm border-b border-editorial-border flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 border border-editorial-border hover:bg-editorial-text hover:text-editorial-bg transition-all"
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="h-8 w-[1px] bg-editorial-border"></div>
            <h2 className="editorial-h3 text-xl">{menuItems.find(m => m.id === activeTab)?.label}</h2>
          </div>
          <div className="editorial-label text-[9px] opacity-40">
            Sharia-Compliant Accounting Information System &bull; v2.4.0
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]">
          <div className="p-12">
            <div className="max-w-6xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </div>

        <footer className="h-10 bg-white border-t border-editorial-border flex items-center justify-between px-8 text-[9px] uppercase tracking-[0.3em] font-bold text-editorial-secondary">
          <span>Status: Database Connected</span>
          <span className="text-editorial-text">Mizan Syariah &copy; 2024</span>
        </footer>
      </main>
    </div>
  );
}
