// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 👇 AQUI ENTRAM AS SUAS CHAVES DO FIREBASE
// (Não compartilhe essas chaves com ninguém fora do projeto)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyAHgdUOsH5-IdSBB_CWxChj22V_VkJrWwM",
  authDomain: "crm-kobber.firebaseapp.com",
  projectId: "crm-kobber",
  storageBucket: "crm-kobber.firebasestorage.app",
  messagingSenderId: "471857064542",
  appId: "1:471857064542:web:a3ce409c4b0ac710dee2cf",
  measurementId: "G-D38JHXFHT8"
};

// Inicializando o App
const app = initializeApp(firebaseConfig);

// Inicializando e Exportando as Ferramentas
export const db = getFirestore(app);        // O Banco de Dados
export const auth = getAuth(app);           // A Autenticação
export const googleProvider = new GoogleAuthProvider(); // O Login do Google