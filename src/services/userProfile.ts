import { doc, runTransaction, serverTimestamp } from 'firebase/firestore/lite'
import { db } from '../lib/firebase'

export async function ensureUserDocument(uid: string, email: string | null) {
  const userRef = doc(db, 'users', uid)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef)
    if (!snapshot.exists()) transaction.set(userRef, { email, createdAt: serverTimestamp() })
  })
}
