# After Gamifikasi

Setup awal project React + Vite + TypeScript dengan Tailwind CSS, React Router DOM, dan Firebase.

## Command

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom firebase
npm install -D tailwindcss @tailwindcss/vite
npm run dev
```

## Environment

Isi file `.env.local` dengan konfigurasi Firebase dari Firebase Console.

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Gunakan `.env.example` sebagai template untuk environment variable yang dibutuhkan.

## Struktur Folder

```text
src/
  main.tsx
  App.tsx
  routes/
    router.tsx
  pages/
    HomePage.tsx
    LoginPage.tsx
    RegisterPage.tsx
  layouts/
    RootLayout.tsx
  components/
    PageContainer.tsx
  lib/
    firebase.ts
  styles/
    globals.css
```

## Routing

```text
/         -> HomePage
/login    -> LoginPage
/register -> RegisterPage
```
