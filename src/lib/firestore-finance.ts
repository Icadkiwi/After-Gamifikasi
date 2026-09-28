import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore/lite'

import type {
  CategoryFormData,
  FinanceCategory,
  FinanceTransaction,
  TransactionFormData,
} from '../types/finance'
import { defaultFinanceCategories } from '../utils/finance'
import { db } from './firebase'
import { getFirebaseErrorMessage } from './forgotPassword'

export async function ensureUserDocument(uid: string, email: string | null) {
  const userRef = doc(db, 'users', uid)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef)

    if (!snapshot.exists()) {
      transaction.set(userRef, { email, createdAt: serverTimestamp() })
    }
  })
}

type FinanceCollectionName = 'transactions' | 'categories'

type LocalFinanceData = {
  transactions: FinanceTransaction[]
  categories: FinanceCategory[]
}

type Unsubscribe = () => void

const localFinanceStoragePrefix = 'after-gamifikasi-finance'
const localFinanceUpdatedEvent = 'after-gamifikasi:finance-updated'
const firestoreBlockedUsers = new Set<string>()

function userCollection(uid: string, collectionName: FinanceCollectionName) {
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

function writeLocalFinanceData(
  uid: string,
  data: LocalFinanceData,
  options: { notify?: boolean } = {},
) {
  if (!uid || !isBrowserStorageAvailable()) {
    return
  }

  localStorage.setItem(getLocalFinanceStorageKey(uid), JSON.stringify(data))

  if (options.notify === false) {
    return
  }

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

function getErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null
    ? (error as { code?: string }).code
    : undefined
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function toError(error: unknown) {
  return new Error(getFirebaseErrorMessage(error, 'Gagal memuat data keuangan. Coba lagi.'))
}

function isRecoverableFirestoreError(error: unknown) {
  const code = getErrorCode(error)
  const message = getErrorMessage(error).toLowerCase()

  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    (!code && message.includes('failed to fetch'))
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

function omitId<T extends { id: string }>(item: T): Omit<T, 'id'> {
  const document = { ...item } as Omit<T, 'id'> & { id?: string }

  delete document.id

  return document
}

async function migrateLocalTransactionsToFirestore(
  uid: string,
  remoteTransactions: FinanceTransaction[],
) {
  const remoteTransactionIds = new Set(
    remoteTransactions.map((transaction) => transaction.id),
  )
  const localOnlyTransactions = readLocalFinanceData(uid).transactions.filter(
    (transaction) =>
      transaction.id.startsWith('transactions-') &&
      !remoteTransactionIds.has(transaction.id),
  )

  if (localOnlyTransactions.length > 0) {
    try {
      await Promise.all(
        localOnlyTransactions.map((transaction) =>
          setDoc(
            doc(db, 'users', uid, 'transactions', transaction.id),
            omitId(transaction),
          ),
        ),
      )
    } catch (error) {
      if (!isRecoverableFirestoreError(error)) {
        throw error
      }
      // Tetap tampilkan data lokal meskipun upload ke Firestore gagal.
    }
  }

  return sortTransactions([...remoteTransactions, ...localOnlyTransactions])
}

async function migrateLocalCategoriesToFirestore(
  uid: string,
  remoteCategories: FinanceCategory[],
) {
  const remoteCategoryIds = new Set(
    remoteCategories.map((category) => category.id),
  )
  const localOnlyCategories = readLocalFinanceData(uid).categories.filter(
    (category) =>
      category.id.startsWith('categories-') &&
      !remoteCategoryIds.has(category.id),
  )

  if (localOnlyCategories.length > 0) {
    try {
      await Promise.all(
        localOnlyCategories.map((category) =>
          setDoc(
            doc(db, 'users', uid, 'categories', category.id),
            omitId(category),
          ),
        ),
      )
    } catch (error) {
      if (!isRecoverableFirestoreError(error)) {
        throw error
      }
      // Tetap tampilkan data lokal meskipun upload ke Firestore gagal.
    }
  }

  return sortCategories([...remoteCategories, ...localOnlyCategories])
}

function sortTransactions(transactions: FinanceTransaction[]) {
  return [...transactions].sort((a, b) => b.date.localeCompare(a.date))
}

function sortCategories(categories: FinanceCategory[]) {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name))
}

async function loadRemoteTransactions(uid: string) {
  const snapshot = await getDocs(userCollection(uid, 'transactions'))

  return sortTransactions(
    snapshot.docs.map((snapshotDoc) =>
      mapFinanceDoc<FinanceTransaction>({
        id: snapshotDoc.id,
        data: () => snapshotDoc.data() as Omit<FinanceTransaction, 'id'>,
      }),
    ),
  )
}

async function loadRemoteCategories(uid: string) {
  const snapshot = await getDocs(userCollection(uid, 'categories'))

  return sortCategories(
    snapshot.docs.map((snapshotDoc) =>
      mapFinanceDoc<FinanceCategory>({
        id: snapshotDoc.id,
        data: () => snapshotDoc.data() as Omit<FinanceCategory, 'id'>,
      }),
    ),
  )
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

  addLocalTransactionWithId(uid, createLocalId('transactions'), {
    ...createTransactionPayload(transaction),
    createdAt: now,
    updatedAt: now,
  })
}

function addLocalTransactionWithId(
  uid: string,
  transactionId: string,
  transaction: Omit<FinanceTransaction, 'id'>,
) {
  const data = readLocalFinanceData(uid)
  const nextTransaction: FinanceTransaction = {
    id: transactionId,
    ...transaction,
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

  addLocalCategoryWithId(uid, createLocalId('categories'), {
    ...category,
    createdAt: now,
    updatedAt: now,
  })
}

function addLocalCategoryWithId(
  uid: string,
  categoryId: string,
  category: Omit<FinanceCategory, 'id'>,
) {
  const data = readLocalFinanceData(uid)
  const nextCategory: FinanceCategory = {
    id: categoryId,
    ...category,
  }

  writeLocalFinanceData(uid, {
    ...data,
    categories: sortCategories([...data.categories, nextCategory]),
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
  let isActive = true
  const emitLocalTransactions = () => {
    if (!isActive) {
      return
    }

    onData(sortTransactions(readLocalFinanceData(uid).transactions))
  }
  const unsubscribeLocal = subscribeLocalFinanceData(uid, emitLocalTransactions)

  if (shouldUseLocalFinanceFallback(uid)) {
    queueMicrotask(emitLocalTransactions)
  } else {
    void loadRemoteTransactions(uid)
      .then(async (remoteTransactions) => {
        if (!isActive) {
          return
        }

        const transactions = await migrateLocalTransactionsToFirestore(
          uid,
          remoteTransactions,
        )

        if (!isActive) {
          return
        }

        writeLocalFinanceData(
          uid,
          {
            ...readLocalFinanceData(uid),
            transactions,
          },
          { notify: false },
        )
        onData(transactions)
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        if (isRecoverableFirestoreError(error)) {
          activateLocalFinanceFallback(uid)
          emitLocalTransactions()
          return
        }

        onError(toError(error))
      })
  }

  return () => {
    isActive = false
    unsubscribeLocal()
  }
}

export function subscribeUserCategories(
  uid: string,
  onData: (categories: FinanceCategory[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  let isActive = true
  const emitLocalCategories = () => {
    if (!isActive) {
      return
    }

    onData(sortCategories(readLocalFinanceData(uid).categories))
  }
  const unsubscribeLocal = subscribeLocalFinanceData(uid, emitLocalCategories)

  if (shouldUseLocalFinanceFallback(uid)) {
    queueMicrotask(emitLocalCategories)
  } else {
    void loadRemoteCategories(uid)
      .then(async (remoteCategories) => {
        if (!isActive) {
          return
        }

        const categories = await migrateLocalCategoriesToFirestore(
          uid,
          remoteCategories,
        )

        if (!isActive) {
          return
        }

        writeLocalFinanceData(
          uid,
          {
            ...readLocalFinanceData(uid),
            categories,
          },
          { notify: false },
        )
        onData(categories)
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        if (isRecoverableFirestoreError(error)) {
          activateLocalFinanceFallback(uid)
          emitLocalCategories()
          return
        }

        onError(toError(error))
      })
  }

  return () => {
    isActive = false
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
    const payload = {
      ...createTransactionPayload(transaction),
      createdAt: now,
      updatedAt: now,
    }
    const docRef = await addDoc(userCollection(uid, 'transactions'), payload)

    addLocalTransactionWithId(uid, docRef.id, payload)
  } catch (error) {
    if (!isRecoverableFirestoreError(error)) {
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
    updateLocalTransaction(uid, transactionId, transaction)
  } catch (error) {
    if (!isRecoverableFirestoreError(error)) {
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
    deleteLocalTransaction(uid, transactionId)
  } catch (error) {
    if (!isRecoverableFirestoreError(error)) {
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
    const payload = {
      ...category,
      createdAt: now,
      updatedAt: now,
    }
    const docRef = await addDoc(userCollection(uid, 'categories'), payload)

    addLocalCategoryWithId(uid, docRef.id, payload)
  } catch (error) {
    if (!isRecoverableFirestoreError(error)) {
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
    updateLocalCategory(uid, categoryId, category)
  } catch (error) {
    if (!isRecoverableFirestoreError(error)) {
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
    deleteLocalCategory(uid, categoryId)
  } catch (error) {
    if (!isRecoverableFirestoreError(error)) {
      throw error
    }

    activateLocalFinanceFallback(uid)
    deleteLocalCategory(uid, categoryId)
  }
}

export async function resetUserFinanceData(uid: string) {
  if (!uid) {
    return
  }

  const emptyData: LocalFinanceData = {
    transactions: [],
    categories: [],
  }

  if (shouldUseLocalFinanceFallback(uid)) {
    writeLocalFinanceData(uid, emptyData)
    return
  }

  try {
    const [transactionsSnapshot, categoriesSnapshot] = await Promise.all([
      getDocs(userCollection(uid, 'transactions')),
      getDocs(userCollection(uid, 'categories')),
    ])
    const batch = writeBatch(db)

    transactionsSnapshot.docs.forEach((snapshotDoc) => {
      batch.delete(snapshotDoc.ref)
    })
    categoriesSnapshot.docs.forEach((snapshotDoc) => {
      batch.delete(snapshotDoc.ref)
    })

    await batch.commit()
    writeLocalFinanceData(uid, emptyData)
  } catch (error) {
    if (!isRecoverableFirestoreError(error)) {
      throw error
    }

    activateLocalFinanceFallback(uid)
    writeLocalFinanceData(uid, emptyData)
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
