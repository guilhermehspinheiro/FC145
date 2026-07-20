// Firebase Configuration for 145FC
// Usando Firebase Compat SDK (CDN, sem bundler)

const firebaseConfig = {
    apiKey: "AIzaSyB92KAZra38dVimgEtSQRDkv63iJU-RGTU",
    authDomain: "fc-app-f37ff.firebaseapp.com",
    projectId: "fc-app-f37ff",
    storageBucket: "fc-app-f37ff.firebasestorage.app",
    messagingSenderId: "332859567333",
    appId: "1:332859567333:web:b86664f8e18f173b54b80c"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Referência global do Firestore
const db = firebase.firestore();
