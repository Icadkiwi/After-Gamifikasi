import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'

import type {
  CategoryFormData,
  FinanceCategory,
  FinanceTransaction,
  TransactionFormData,
} from '../types/finance'
import { defaultFinanceCategories } from '../utils/finance'
import { db } from './firebase'

type FinanceCollectionName = 'transactions' | 'categories'

type LocalFinanceData = {
  transactions: FinanceTransaction[]
  categories: FinanceCategory[]
}

const localFinanceStoragePrefix = 'after-gamifikasi-finance'
const localFinanceUpdatedEvent = 'after-gamifikasi:finance-updated'
const firestoreBlockedUsers = new Set<string>()

function userCollection(uid: string, collectionName: string) {
  return collection(db, 'users', uid, collectionName)
}

function getLocalFinanceStorageKey(uid: string) {
  return `${localFinanceStoragePrefix}-${uid}`
}

function isBrowserStorageAvailable() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

function createLocalId(prefix: FinanceCollectionName) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function readLocalFinanceData(uid: string): LocalFinanceData {
  if (!uid || !isBrowserStorageAvailable()) {
    return {
      transactions: [],
      categories: [],
    }
  }

  try {
    const rawValue = localStorage.getItem(getLocalFinanceStorageKey(uid))

    if (!rawValue) {
      return {
        transactions: [],
        categories: [],
      }
    }

    const parsedValue = JSON.parse(rawValue) as Partial<LocalFinanceData>

    return {
      transactions: Array.isArray(parsedValue.transactions)
        ? parsedValue.transactions
        : [],
      categories: Array.isArray(parsedValue.categories)
        ? parsedValue.categories
        : [],
    }
  } catch {
    return {
      transactions: [],
      categories: [],
    }
  }
}

function writeLocalFinanceData(uid: string, data: LocalFinanceData) {
  if (!uid || !isBrowserStorageAvailable()) {
    return
  }

  localStorage.setItem(getLocalFinanceStorageKey(uid), JSON.stringify(data))
  window.dispatchEvent(
    new CustomEvent(localFinanceUpdatedEvent, {
      detail: { uid },
    }),
  )
}

function subscribeLocalFinanceData(
  uid: string,
  onData: () => void,
): Unsubscribe {
  if (!uid || typeof window === 'undefined') {
    return () => {}
  }

  const handleLocalUpdate = (event: Event) => {
    const detail = (event as CustomEvent<{ uid: string }>).detail

    if (detail.uid === uid) {
      onData()
    }
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key === getLocalFinanceStorageKey(uid)) {
      onData()
    }
  }

  window.addEventListener(localFinanceUpdatedEvent, handleLocalUpdate)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(localFinanceUpdatedEvent, handleLocalUpdate)
    window.removeEventListener('storage', handleStorage)
  }
}

function isPermissionDeniedError(error: unknown) {
  const code = (error as { code?: string }).code
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase()

  return (
    code === 'permission-denied' ||
    message.includes('missing or insufficient permissions')
  )
}

function activateLocalFinanceFallback(uid: string) {
  const wasUsingFallback = firestoreBlockedUsers.has(uid)

  firestoreBlockedUsers.add(uid)

  if (wasUsingFallback || typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(localFinanceUpdatedEvent, {
      detail: { uid },
    }),
  )
}

function shouldUseLocalFinanceFallback(uid: string) {
  return firestoreBlockedUsers.has(uid)
}

function mapFinanceDoc<T extends { id: string }>(
  snapshotDoc: { id: string; data: () => Omit<T, 'id'> },
) {
  return {
    id: snapshotDoc.id,
    ...snapshotDoc.data(),
  } as T
}

function createTransactionPayload(transaction: TransactionFormData) {
  const note = transaction.note?.trim()

  return {
    title: transaction.title,
    type: transaction.type,
    amount: transaction.amount,
    date: transaction.date,
    categoryId: transaction.categoryId,
    categoryName: transaction.categoryName,
    ...(note ? { note } : {}),
  }
}

function addLocalTransaction(uid: string, transaction: TransactionFormData) {
  const now = Date.now()
  const data = readLocalFinanceData(uid)
  const nextTransaction: FinanceTransaction = {
    id: createLocalId('transactions'),
    ...createTransactionPayload(transaction),
    createdAt: now,
    updatedAt: now,
  }

  writeLocalFinanceData(uid, {
    ...data,
    transactions: [nextTransaction, ...data.transactions],
  })
}

function updateLocalTransaction(
  uid: string,
  transactionId: string,
  transaction: TransactionFormData,
) {
  const data = readLocalFinanceData(uid)
  const nextTransactions = data.transactions.map((item) =>
    item.id === transactionId
      ? {
          ...item,
          ...createTransactionPayload(transaction),
          updatedAt: Date.now(),
        }
      : item,
  )

  writeLocalFinanceData(uid, {
    ...data,
    transactions: nextTransactions,
  })
}

function deleteLocalTransaction(uid: string, transactionId: string) {
  const data = readLocalFinanceData(uid)

  writeLocalFinanceData(uid, {
    ...data,
    transactions: data.transactions.filter((item) => item.id !== transactionId),
  })
}

function addLocalCategory(uid: string, category: CategoryFormData) {
  const now = Date.now()
  const data = readLocalFinanceData(uid)
  const nextCategory: FinanceCategory = {
    id: createLocalId('categories'),
    ...category,
    createdAt: now,
    updatedAt: now,
  }

  writeLocalFinanceData(uid, {
    ...data,
    categories: [...data.categories, nextCategory].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  })
}

function updateLocalCategory(
  uid: string,
  categoryId: string,
  category: CategoryFormData,
) {
  const data = readLocalFinanceData(uid)
  const nextCategories = data.categories
    .map((item) =>
      item.id === categoryId
        ? {
            ...item,
            ...category,
            updatedAt: Date.now(),
          }
        : item,
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  writeLocalFinanceData(uid, {
    ...data,
    categories: nextCategories,
  })
}

function deleteLocalCategory(uid: string, categoryId: string) {
  const data = readLocalFinanceData(uid)

  writeLocalFinanceData(uid, {
    ...data,
    categories: data.categories.filter((item) => item.id !== categoryId),
  })
}

export function subscribeUserTransactions(
  uid: string,
  onData: (transactions: FinanceTransaction[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const emitLocalTransactions = () => {
    onData(
      readLocalFinanceData(uid).transactions.sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    )
  }
  const unsubscribeLocal = subscribeLocalFinanceData(uid, () => {
    if (shouldUseLocalFinanceFallback(uid)) {
      emitLocalTransactions()
    }
  })
  let unsubscribeRemote: Unsubscribe | null = null

  if (shouldUseLocalFinanceFallback(uid)) {
    queueMicrotask(emitLocalTransactions)
  }

  try {
    unsubscribeRemote = onSnapshot(
      userCollection(uid, 'transactions'),
      (snapshot) => {
        if (shouldUseLocalFinanceFallback(uid)) {
          return
        }

        const transactions = snapshot.docs
          .map((snapshotDoc) =>
            mapFinanceDoc<FinanceTransaction>({
              id: snapshotDoc.id,
              data: () =>
                snapshotDoc.data() as Omit<FinanceTransaction, 'id'>,
            }),
          )
          .sort((a, b) => b.date.localeCompare(a.date))

        writeLocalFinanceData(uid, {
          ...readLocalFinanceData(uid),
          transactions,
        })
        onData(transactions)
      },
      (error) => {
        if (isPermissionDeniedError(error)) {
          activateLocalFinanceFallback(uid)
          emitLocalTransactions()
          return
        }

        onError(error)
      },
    )
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      activateLocalFinanceFallback(uid)
      emitLocalTransactions()
    } else {
      onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  return () => {
    unsubscribeRemote?.()
    unsubscribeLocal()
  }
}

export function subscribeUserCategories(
  uid: string,
  onData: (categories: FinanceCategory[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const emitLocalCategories = () => {
    onData(
      readLocalFinanceData(uid).categories.sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    )
  }
  const unsubscribeLocal = subscribeLocalFinanceData(uid, () => {
    if (shouldUseLocalFinanceFallback(uid)) {
      emitLocalCategories()
    }
  })
  let unsubscribeRemote: Unsubscribe | null = null

  if (shouldUseLocalFinanceFallback(uid)) {
    queueMicrotask(emitLocalCategories)
  }

  try {
    unsubscribeRemote = onSnapshot(
      userCollection(uid, 'categories'),
      (snapshot) => {
        if (shouldUseLocalFinanceFallback(uid)) {
          return
        }

        const categories = snapshot.docs
          .map((snapshotDoc) =>
            mapFinanceDoc<FinanceCategory>({
              id: snapshotDoc.id,
              data: () => snapshotDoc.data() as Omit<FinanceCategory, 'id'>,
            }),
          )
          .sort((a, b) => a.name.localeCompare(b.name))

        writeLocalFinanceData(uid, {
          ...readLocalFinanceData(uid),
          categories,
        })
        onData(categories)
      },
      (error) => {
        if (isPermissionDeniedError(error)) {
          activateLocalFinanceFallback(uid)
          emitLocalCategories()
          return
        }

        onError(error)
      },
    )
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      activateLocalFinanceFallback(uid)
      emitLocalCategories()
    } else {
      onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  return () => {
    unsubscribeRemote?.()
    unsubscribeLocal()
  }
}

export async function addUserTransaction(
  uid: string,
  transaction: TransactionFormData,
) {
  const now = Date.now()

  if (shouldUseLocalFinanceFallback(uid)) {
    addLocalTransaction(uid, transaction)
    return
  }

  try {
    await addDoc(userCollection(uid, 'transactions'), {
      ...createTransactionPayload(transaction),
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error
    }

    activateLocalFinanceFallback(uid)
    addLocalTransaction(uid, transaction)
  }
}

export async function updateUserTransaction(
  uid: string,
  transactionId: string,
  transaction: TransactionFormData,
) {
  if (shouldUseLocalFinanceFallback(uid)) {
    updateLocalTransaction(uid, transactionId, transaction)
    return
  }

  try {
    await updateDoc(doc(db, 'users', uid, 'transactions', transactionId), {
      ...createTransactionPayload(transaction),
      updatedAt: Date.now(),
    })
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error
    }

    activateLocalFinanceFallback(uid)
    updateLocalTransaction(uid, transactionId, transaction)
  }
}

export async function deleteUserTransaction(uid: string, transactionId: string) {
  if (shouldUseLocalFinanceFallback(uid)) {
    deleteLocalTransaction(uid, transactionId)
    return
  }

  try {
    await deleteDoc(doc(db, 'users', uid, 'transactions', transactionId))
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error
    }

    activateLocalFinanceFallback(uid)
    deleteLocalTransaction(uid, transactionId)
  }
}

export async function addUserCategory(uid: string, category: CategoryFormData) {
  const now = Date.now()

  if (shouldUseLocalFinanceFallback(uid)) {
    addLocalCategory(uid, category)
    return
  }

  try {
    await addDoc(userCollection(uid, 'categories'), {
      ...category,
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error
    }

    activateLocalFinanceFallback(uid)
    addLocalCategory(uid, category)
  }
}

export async function updateUserCategory(
  uid: string,
  categoryId: string,
  category: CategoryFormData,
) {
  if (shouldUseLocalFinanceFallback(uid)) {
    updateLocalCategory(uid, categoryId, category)
    return
  }

  try {
    await updateDoc(doc(db, 'users', uid, 'categories', categoryId), {
      ...category,
      updatedAt: Date.now(),
    })
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error
    }

    activateLocalFinanceFallback(uid)
    updateLocalCategory(uid, categoryId, category)
  }
}

export async function deleteUserCategory(uid: string, categoryId: string) {
  if (shouldUseLocalFinanceFallback(uid)) {
    deleteLocalCategory(uid, categoryId)
    return
  }

  try {
    await deleteDoc(doc(db, 'users', uid, 'categories', categoryId))
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error
    }

    activateLocalFinanceFallback(uid)
    deleteLocalCategory(uid, categoryId)
  }
}

export async function ensureDefaultUserCategories(
  uid: string,
  categories: FinanceCategory[],
) {
  const existingCategoryKeys = new Set(
    categories.map((category) =>
      `${category.type}:${category.name.trim().toLowerCase()}`,
    ),
  )
  const missingCategories = defaultFinanceCategories.filter(
    (category) =>
      !existingCategoryKeys.has(
        `${category.type}:${category.name.trim().toLowerCase()}`,
      ),
  )

  await Promise.all(
    missingCategories.map((category) => addUserCategory(uid, category)),
  )
}
