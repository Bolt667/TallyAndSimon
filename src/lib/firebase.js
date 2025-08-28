import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// ⬇️ Your config
const firebaseConfig = {
  apiKey: "AIzaSyBDzWq0O6CM8VbrgusJUOHC45FMx0a8tKw",
  authDomain: "wedding-website-dc15b.firebaseapp.com",
  projectId: "wedding-website-dc15b",
  storageBucket: "wedding-website-dc15b.appspot.com",
  messagingSenderId: "922089864980",
  appId: "1:922089864980:web:9c8557940e85b0799f8c01"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

export function waitForAuth() {
  return new Promise((resolve) => {
    const off = onAuthStateChanged(auth, (user) => {
      if (user) { off(); resolve(user); }
    });
  });
}

export async function ensureAnonAuth() {
  try { await signInAnonymously(auth); } catch (e) { console.error(e); }
  await waitForAuth();
}
