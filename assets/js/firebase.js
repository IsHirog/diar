import { FIREBASE_CONFIG } from "./config.js";
import { initializeApp }          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp, deleteDoc, doc }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Auth ────────────────────────────────────────────────────
export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function login() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

// ── Posts ───────────────────────────────────────────────────
export async function savePost(data) {
  return addDoc(collection(db, "posts"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function fetchPosts() {
  const q    = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deletePost(id) {
  return deleteDoc(doc(db, "posts", id));
}
