import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore/lite'

const firebaseConfig = {
  apiKey: 'AIzaSyBsjdniJqqErmZ7hwB8YCeiUW3_YpPiq8c',
  authDomain: 'after-gamification.firebaseapp.com',
  projectId: 'after-gamification',
  storageBucket: 'after-gamification.firebasestorage.app',
  messagingSenderId: '363834436195',
  appId: '1:363834436195:web:f1ab7f912650e5ad1ea656',
}

export const app = getApps().some((app) => app.name === '[DEFAULT]')
  ? getApp()
  : initializeApp(firebaseConfig)
export const auth = getAuth(app)
auth.languageCode = 'id'
export const db = getFirestore(app)
