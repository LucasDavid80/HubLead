import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBImke3vEFE0_VLv868iZ6rl-WC5WDGKnQ",
    authDomain: "hublead-mvp.firebaseapp.com",
    projectId: "hublead-mvp",
    storageBucket: "hublead-mvp.firebasestorage.app",
    messagingSenderId: "315640575902",
    appId: "1:315640575902:web:4953f7293c4822e1d9888f"
};

// Singleton para iniciar o Firebase apenas uma vez
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// ESTA LINHA ABAIXO É A MAIS IMPORTANTE, ELA QUE FALTAVA:
export { auth, db };