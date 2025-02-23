const firebaseConfig = {
    apiKey: "AIzaSyBd5dftCN7383eS026KPGW8Pafe1qP6upE",
    authDomain: "hyperchatbra.firebaseapp.com",
    databaseURL: "https://hyperchatbra-default-rtdb.firebaseio.com",
    projectId: "hyperchatbra",
    storageBucket: "hyperchatbra.appspot.com",
    messagingSenderId: "119912523766",
    appId: "1:119912523766:web:d6da228bf54b8e30a249d7"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();