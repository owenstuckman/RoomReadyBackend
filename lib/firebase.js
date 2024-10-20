import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// const firebaseConfig = {
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//     authDomain: "passportal-a7710.firebaseapp.com",
//     databaseURL: "https://passportal-a7710-default-rtdb.firebaseio.com",
//     projectId: "passportal-a7710",
//     storageBucket: "passportal-a7710.appspot.com",
//     messagingSenderId: "246483948057",
//     appId: "1:246483948057:web:6e8b34e62d09592e4f1088",
//     measurementId: "G-2CGP91VMY5"
//   };

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: "roomready-5fe97.firebaseapp.com",
    projectId: "roomready-5fe97",
    storageBucket: "roomready-5fe97.appspot.com",
    messagingSenderId: "664495346097",
    appId: "1:664495346097:web:7c7c24156bb3a60bc86d90"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };