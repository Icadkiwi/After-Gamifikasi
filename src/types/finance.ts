export type FinanceRecordType = 'income' | 'expense'

export type FinanceTab =
  | 'dashboard'
  | 'transactions'
  | 'categories'
  | 'statistics'

export type FinanceTransaction = {
  id: string
  title: string
  type: FinanceRecordType
  amount: number
  date: string
  categoryId: string
  categoryName: string
  note?: string
  createdAt?: number
  updatedAt?: number
}

export type FinanceCategory = {
  id: string
  name: string
  type: FinanceRecordType
  color: string
  createdAt?: number
  updatedAt?: number
}

export type TransactionFormData = Omit<
  FinanceTransaction,
  'id' | 'createdAt' | 'updatedAt'
>

export type CategoryFormData = Omit<
  FinanceCategory,
  'id' | 'createdAt' | 'updatedAt'
>
