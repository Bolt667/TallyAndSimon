import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

/* ---------------- Firebase config ---------------- */
// A robust default configuration for Firebase services.
const defaultFirebaseConfig = {
  apiKey: "AIzaSyBDzWq0O6CM8VbrgusJUOHC45FMx0a8tKw",
  authDomain: "wedding-website-dc15b.firebaseapp.com",
  projectId: "wedding-website-dc15b",
  storageBucket: "wedding-website-dc15b.appspot.com",
  messagingSenderId: "922089864980",
  appId: "1:922089864980:web:9c8557940e85b0799f8c01",
};

/* eslint-disable no-undef */
// Use environment-injected variables if they exist, otherwise fall back to the default config.
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : defaultFirebaseConfig;
const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
/* eslint-enable no-undef */

/* ---------------- Main App ---------------- */
// The core application component.
export default function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [storage, setStorage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [photos, setPhotos] = useState([]);
  const [uploadMessage, setUploadMessage] = useState({ type: "idle", text: "" });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Firebase services and user authentication.
  useEffect(() => {
    let unsubAuth;
    (async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const authService = getAuth(app);
        const storageService = getStorage(app);

        setDb(firestore);
        setAuth(authService);
        setStorage(storageService);

        // Listen for authentication state changes and sign in as needed.
        unsubAuth = onAuthStateChanged(
          authService,
          async (user) => {
            if (!user) {
              try {
                if (initialAuthToken) {
                  await signInWithCustomToken(authService, initialAuthToken);
                } else {
                  await signInAnonymously(authService);
                }
              } catch (err) {
                console.error("Auth sign-in error:", err);
                setUploadMessage({
                  type: "error",
                  text: `Auth failed: ${err.code || err.message}`,
                });
                return;
              }
              return;
            }
            setUserId(user.uid);
            setIsAuthReady(true);
          },
          (err) => {
            console.error("Auth state error:", err);
            setUploadMessage({
              type: "error",
              text: `Auth listener error: ${err.code || err.message}`,
            });
          }
        );
      } catch (error) {
        console.error("🔥 Firebase init failed:", error);
        setUploadMessage({
          type: "error",
          text: `Could not connect: ${error.code || error.message}`,
        });
      }
    })();

    // Cleanup function to unsubscribe from the auth listener.
    return () => {
      if (typeof unsubAuth === "function") unsubAuth();
    };
  }, []);

  // Set up a real-time listener for the photo gallery.
  useEffect(() => {
    if (!isAuthReady || !db) return;
    const photoCollectionPath = `artifacts/${appId}/public/data/weddingPhotos`;
    const q = query(collection(db, photoCollectionPath));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...(d.data?.() ?? d.data()) }));
        // Sort photos by timestamp locally to avoid needing a Firestore index.
        items.sort((a, b) => {
          const aTs = a?.timestamp?.toMillis?.() ?? 0;
          const bTs = b?.timestamp?.toMillis?.() ?? 0;
          return bTs - aTs;
        });
        setPhotos(items);
      },
      (err) => {
        console.error("Error fetching photos:", err);
        setUploadMessage({ type: "error", text: "Failed to load photos." });
      }
    );
    // Cleanup function to unsubscribe from the Firestore listener.
    return () => unsub();
  }, [isAuthReady, db]);

  // Handle the photo upload process.
  async function handlePhotoUpload(e) {
    e.preventDefault();
    if (!db || !userId || !storage || !isAuthReady) {
      setUploadMessage({ type: "error", text: "App is not ready. Please wait a moment." });
      return;
    }

    const form = e.currentTarget;
    const file = form.photoFile?.files?.[0];
    const guestName = form.guestName?.value?.trim() || "Anonymous";
    if (!file) {
      setUploadMessage({ type: "error", text: "Please select a photo." });
      return;
    }

    setIsLoading(true);
    setUploadMessage({ type: "idle", text: "" });

    try {
      const safeName = file.name.replace(/\s+/g, "_");
      const path = `user-uploads/${userId}/${Date.now()}_${safeName}`;

      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, `artifacts/${appId}/public/data/weddingPhotos`), {
        url,
        guestName,
        timestamp: serverTimestamp(),
        userId,
        originalName: safeName,
      });

      setUploadMessage({ type: "success", text: "Photo uploaded successfully!" });
    } catch (err) {
      console.error("Upload error:", err);
      setUploadMessage({ type: "error", text: `Upload failed: ${err.message}` });
    } finally {
      setIsLoading(false);
      e.target.reset();
    }
  }

  return (
    <div
      className="w-screen min-h-screen bg-fixed bg-cover bg-center text-[#333] font-inter"
      style={{ backgroundImage: "url('/images/wedding-bg.jpg')" }}
    >
      {userId && (
        <div className="fixed top-4 left-4 text-xs bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md z-50">
          Your User ID: <span className="font-mono break-all">{userId}</span>
        </div>
      )}

      {/* Hero */}
      <section className="relative h-screen flex flex-col items-center justify-center text-white text-center p-8">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold font-serif leading-tight">
            Talesa &amp; Simon
          </h1>
          <p className="text-lg sm:text-xl font-light">27th September 2025</p>
        </div>
      </section>

      {/* Food & Drink */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-[#e9e4d9]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center justify-center gap-12 md:gap-16">
          <div className="w-full md:w-1/2 flex justify-center">
            <img
              src="https://placehold.co/600x600/b8b8b8/fff?text=Food+and+Drink+Image"
              alt="Food and Drink"
              className="rounded-xl shadow-lg w-full max-w-md lg:max-w-lg object-cover"
            />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
            <h2 className="text-3xl sm:text-4xl font-semibold font-serif text-[#555]">
              Food &amp; Drink
            </h2>
            <p className="text-base sm:text-lg text-gray-700">
              Starters, mains, desserts, and signature cocktails…
            </p>
          </div>
        </div>
      </section>

      {/* Gallery & Upload */}
      <section id="gallery" className="py-16 sm:py-24 px-4 sm:px-8 bg-[#fcfaf7]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto space-y-12">
          <h2 className="text-4xl sm:text-5xl font-semibold font-serif text-center text-[#555] mb-8">
            Guest Photo Gallery
          </h2>

          {/* Upload form */}
          <div className="bg-gray-100/90 p-6 sm:p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center text-[#555] mb-6">
              Upload Your Photos
            </h3>
            <form onSubmit={handlePhotoUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="guestName"
                  placeholder="Your Name (Optional)"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8c8266]"
                />
                <input
                  type="file"
                  name="photoFile"
                  accept="image/*"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !isAuthReady}
                className="w-full bg-[#8c8266] text-white py-3 rounded-md font-semibold hover:bg-[#6c6450] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Uploading..." : "Upload Photo"}
              </button>
            </form>
            {uploadMessage.text && (
              <p
                className={`mt-4 text-center text-sm font-semibold ${
                  uploadMessage.type === "success"
                    ? "text-green-600"
                    : uploadMessage.type === "error"
                    ? "text-red-600"
                    : "text-gray-600"
                  }`}
                >
                  {uploadMessage.text}
                </p>
              )}
              {!isAuthReady && (
                <p className="mt-4 text-center text-sm font-semibold text-gray-500">
                  Connecting to server...
                </p>
              )}
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
              {photos.length > 0 ? (
                photos.map((p) => (
                  <div key={p.id} className="relative group overflow-hidden rounded-xl shadow-lg">
                    <img
                      src={p.url}
                      alt={`Uploaded by ${p.guestName}`}
                      className="w-full h-full object-cover aspect-square transform transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-center font-semibold text-lg p-2">
                        {p.guestName || "Guest"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500 py-10">
                  Be the first to upload a photo!
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#333] text-white text-center py-6">
          <p className="text-sm">&copy; 2025 Talesa &amp; Simon. All rights reserved.</p>
        </footer>
      </div>
    );
}
