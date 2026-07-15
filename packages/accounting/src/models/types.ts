export type AccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'income'
  | 'expense'
  | 'off_balance';

export type JournalType =
  | 'sale'
  | 'purchase'
  | 'cash'
  | 'bank'
  | 'general'
  | 'inventory';

export type MoveState = 'draft' | 'posted' | 'cancel';

export type InvoiceMoveType =
  | 'out_invoice'
  | 'out_refund'
  | 'in_invoice'
  | 'in_refund';

export interface AccountAccount {
  id?: string;
  companyId?: string;
  code: string;
  name: string;
  accountType?: AccountType;
  reconcile?: boolean;
  active?: boolean;
  createdAt?: Date;
}

export interface AccountJournal {
  id?: string;
  companyId?: string;
  name: string;
  code?: string;
  journalType?: JournalType;
  defaultAccountId?: string;
  active?: boolean;
  createdAt?: Date;
}

export interface AccountMoveLine {
  id?: string;
  companyId?: string;
  moveId?: string;
  accountId: string;
  partnerId?: string;
  name?: string;
  debit?: number;
  credit?: number;
  taxId?: string;
  productId?: string;
  quantity?: number;
  priceUnit?: number;
}

export interface AccountMove {
  id?: string;
  companyId?: string;
  name?: string;
  ref?: string;
  journalId?: string;
  date?: string;
  state?: MoveState;
  partnerId?: string;
  /** Link to invoice / stock picking / etc. */
  sourceModel?: string;
  sourceId?: string;
  lineIds?: string[];
  createdAt?: Date;
}

export interface AccountInvoiceLine {
  id?: string;
  companyId?: string;
  invoiceId?: string;
  productId?: string;
  name?: string;
  quantity?: number;
  priceUnit?: number;
  taxIds?: string[];
  accountId?: string;
  subtotal?: number;
}

export interface AccountInvoice {
  id?: string;
  companyId?: string;
  name?: string;
  partnerId?: string;
  moveType?: InvoiceMoveType;
  invoiceDate?: string;
  state?: MoveState | 'paid';
  amountUntaxed?: number;
  amountTax?: number;
  amountTotal?: number;
  amountResidual?: number;
  moveId?: string;
  journalId?: string;
  lineIds?: string[];
  narrations?: string;
  createdAt?: Date;
}

export interface AccountPayment {
  id?: string;
  companyId?: string;
  name?: string;
  partnerId?: string;
  amount?: number;
  paymentType?: 'inbound' | 'outbound';
  journalId?: string;
  invoiceId?: string;
  moveId?: string;
  state?: MoveState;
  paymentDate?: string;
  createdAt?: Date;
}

export interface AccountingStore {
  findMove(id: string): Promise<AccountMove | null>;
  findMoveLines(moveId: string): Promise<AccountMoveLine[]>;
  updateMove(id: string, data: Partial<AccountMove>): Promise<AccountMove>;
  updateMoveLine(id: string, data: Partial<AccountMoveLine>): Promise<AccountMoveLine>;
  createMove(data: AccountMove): Promise<AccountMove>;
  createMoveLine(data: AccountMoveLine): Promise<AccountMoveLine>;
  findInvoice?(id: string): Promise<AccountInvoice | null>;
  findInvoiceLines?(invoiceId: string): Promise<AccountInvoiceLine[]>;
  updateInvoice?(id: string, data: Partial<AccountInvoice>): Promise<AccountInvoice>;
  findJournal?(id: string): Promise<AccountJournal | null>;
  findAccount?(id: string): Promise<AccountAccount | null>;
  listPostedLines?(filters?: {
    companyId?: string;
    accountId?: string;
  }): Promise<AccountMoveLine[]>;
  /** Optional; TypeORM/Mongoose factory adapters provide this when available. */
  runInTransaction?<T>(fn: () => Promise<T>): Promise<T>;
}
