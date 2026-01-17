import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBJiiEt7C_KUMiW6XmR9vziilie9sdUxUU",
    authDomain: "twitter-clone-f4bf3.firebaseapp.com",
    projectId: "twitter-clone-f4bf3",
    storageBucket: "twitter-clone-f4bf3.firebasestorage.app",
    messagingSenderId: "898632959819",
    appId: "1:898632959819:web:1d48304a89677655f44ace",
    measurementId: "G-1BNP2TBHSR"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

