/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { useAuth } from './AuthContext'
import {
  addUserCategory,
  addUserTransaction,
  deleteUserCategory,
  deleteUserTransaction,
  subscribeUserCategories,
  subscribeUserTransactions,
  ensureDefaultUserCategories,
  updateUserCategory,
  updateUserTransaction,
} from '../lib/firestore-finance'
import {
  syncFinanceAchievementProgress,
  updateAchievementProgress,
} from '../game/achievementService'
import { grantTransactionReward } from '../game/gamificationService'
import type {
  CategoryFormData,
  FinanceCategory,
  FinanceTransaction,
  TransactionFormData,
} from '../types/finance'

type FinanceContextValue = {
  transactions: FinanceTransaction[]
  categories: FinanceCategory[]
  loading: boolean
  error: string
  addTransaction: (transaction: TransactionFormData) => Promise<void>
  updateTransaction: (
    transactionId: string,
    transaction: TransactionFormData,
  ) => Promise<void>
  deleteTransaction: (transactionId: string) => Promise<void>
  addCategory: (category: CategoryFormData) => Promise<void>
  updateCategory: (
    categoryId: string,
    category: CategoryFormData,
  ) => Promise<void>
  deleteCategory: (categoryId: string) => Promise<void>
}

const FinanceContext = createContext<FinanceContextValue | undefined>(
  undefined,
)

type FinanceProviderProps = {
  children: ReactNode
}

export function FinanceProvider({ children }: FinanceProviderProps) {
  const { user } = useAuth()
  const ensuredDefaultCategoriesForUserRef = useRef<string | null>(null)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    if (!user) {
      ensuredDefaultCategoriesForUserRef.current = null
      queueMicrotask(() => {
        if (!isActive) {
          return
        }

        setTransactions([])
        setCategories([])
        setLoading(false)
      })

      return () => {
        isActive = false
      }
    }

    let transactionsLoaded = false
    let categoriesLoaded = false
    const markLoaded = (collection: 'transactions' | 'categories') => {
      if (collection === 'transactions') {
        transactionsLoaded = true
      } else {
        categoriesLoaded = true
      }

      if (transactionsLoaded && categoriesLoaded) {
        setLoading(false)
      }
    }
    const handleError = (financeError: Error) => {
      setError(financeError.message)
      setLoading(false)
    }

    queueMicrotask(() => {
      if (!isActive) {
        return
      }

      setLoading(true)
      setError('')
    })

    const unsubscribeTransactions = subscribeUserTransactions(
      user.uid,
      (nextTransactions) => {
        setTransactions(nextTransactions)
        markLoaded('transactions')
      },
      handleError,
    )
    const unsubscribeCategories = subscribeUserCategories(
      user.uid,
      (nextCategories) => {
        setCategories(nextCategories)

        if (ensuredDefaultCategoriesForUserRef.current !== user.uid) {
          ensuredDefaultCategoriesForUserRef.current = user.uid
          void ensureDefaultUserCategories(user.uid, nextCategories).catch(
            handleError,
          )
        }

        markLoaded('categories')
      },
      handleError,
    )

    return () => {
      isActive = false
      unsubscribeTransactions()
      unsubscribeCategories()
    }
  }, [user])

  function requireUid() {
    if (!user) {
      throw new Error('User belum login.')
    }

    return user.uid
  }

  async function addTransactionWithReward(transaction: TransactionFormData) {
    const uid = requireUid()
    const nextTransactions: FinanceTransaction[] = [
      {
        ...transaction,
        id: `pending-${Date.now()}`,
      },
      ...transactions,
    ]

    await addUserTransaction(uid, transaction)
    updateAchievementProgress(uid, 'finance_bronze_first_transaction')
    syncFinanceAchievementProgress(uid, {
      transactions: nextTransactions,
      categories,
      trackFinanceDay: true,
    })

    grantTransactionReward(uid, 'addTransaction')
  }

  async function updateTransactionWithReward(
    transactionId: string,
    transaction: TransactionFormData,
  ) {
    const uid = requireUid()
    const nextTransactions = transactions.map((item) =>
      item.id === transactionId
        ? {
            ...item,
            ...transaction,
            updatedAt: Date.now(),
          }
        : item,
    )

    await updateUserTransaction(uid, transactionId, transaction)
    syncFinanceAchievementProgress(uid, {
      transactions: nextTransactions,
      categories,
    })
    updateAchievementProgress(uid, 'finance_silver_edit_transaction')

    grantTransactionReward(uid, 'editTransaction')
  }

  async function deleteTransactionWithReward(transactionId: string) {
    const uid = requireUid()
    const nextTransactions = transactions.filter(
      (item) => item.id !== transactionId,
    )

    await deleteUserTransaction(uid, transactionId)
    syncFinanceAchievementProgress(uid, {
      transactions: nextTransactions,
      categories,
    })
    updateAchievementProgress(uid, 'finance_gold_delete_transaction')

    grantTransactionReward(uid, 'deleteTransaction')
  }

  async function addCategoryWithAchievement(category: CategoryFormData) {
    const uid = requireUid()

    await addUserCategory(uid, category)
    updateAchievementProgress(uid, 'finance_silver_add_category')
    syncFinanceAchievementProgress(uid, {
      transactions,
      categories: [
        ...categories,
        {
          ...category,
          id: `pending-${Date.now()}`,
        },
      ],
    })
  }

  const value: FinanceContextValue = {
    transactions,
    categories,
    loading,
    error,
    addTransaction: addTransactionWithReward,
    updateTransaction: updateTransactionWithReward,
    deleteTransaction: deleteTransactionWithReward,
    addCategory: addCategoryWithAchievement,
    updateCategory: (categoryId, category) =>
      updateUserCategory(requireUid(), categoryId, category),
    deleteCategory: (categoryId) => deleteUserCategory(requireUid(), categoryId),
  }

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)

  if (!context) {
    throw new Error('useFinance harus digunakan di dalam FinanceProvider.')
  }

  return context
}
