export type FundType = 'Zakat' | 'Infaq' | 'Amil' | 'General';
export type AccountCategory = 'Asset' | 'Liability' | 'NetAsset' | 'Revenue' | 'Expense';

export interface Account {
  id?: string;
  code: string;
  name: string;
  category: AccountCategory;
  fundType: FundType;
  description?: string;
}

export interface Transaction {
  id?: string;
  date: string;
  description: string;
  reference?: string;
  total: number;
  createdBy: string;
  createdAt: string;
}

export interface JournalEntry {
  id?: string;
  transactionId: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
  fundType: FundType;
  date: string;
}

export interface Budget {
  id?: string;
  accountId: string;
  accountName?: string;
  period: string;
  amount: number;
}

export const INITIAL_COA: Account[] = [
  // Assets
  { code: '1101', name: 'Kas/Bank Operasional', category: 'Asset', fundType: 'General' },
  { code: '1102', name: 'Kas/Bank Zakat', category: 'Asset', fundType: 'Zakat' },
  { code: '1103', name: 'Kas/Bank Infaq', category: 'Asset', fundType: 'Infaq' },
  // Liabilities
  { code: '2101', name: 'Hutang Operasional', category: 'Liability', fundType: 'General' },
  // Net Assets
  { code: '3101', name: 'Dana Terikat - Zakat', category: 'NetAsset', fundType: 'Zakat' },
  { code: '3102', name: 'Dana Tidak Terikat - Infaq', category: 'NetAsset', fundType: 'Infaq' },
  { code: '3103', name: 'Dana Amil', category: 'NetAsset', fundType: 'Amil' },
  // Revenue
  { code: '4101', name: 'Penerimaan Zakat', category: 'Revenue', fundType: 'Zakat' },
  { code: '4201', name: 'Penerimaan Infaq/Sadaqah', category: 'Revenue', fundType: 'Infaq' },
  { code: '4301', name: 'Pendapatan SPP Pendidikan', category: 'Revenue', fundType: 'General' },
  // Expenses
  { code: '5101', name: 'Penyaluran Zakat - Beasiswa', category: 'Expense', fundType: 'Zakat' },
  { code: '5201', name: 'Beban Gaji Guru', category: 'Expense', fundType: 'General' },
  { code: '5202', name: 'Beban Listrik & Air', category: 'Expense', fundType: 'General' },
  { code: '5301', name: 'Beban Operasional Amil', category: 'Expense', fundType: 'Amil' },
];
