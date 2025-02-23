// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBd5dftCN7383eS026KPGW8Pafe1qP6upE",
    authDomain: "hyperchatbra.firebaseapp.com",
    databaseURL: "https://hyperchatbra-default-rtdb.firebaseio.com",
    projectId: "hyperchatbra",
    storageBucket: "hyperchatbra.appspot.com",
    messagingSenderId: "119912523766",
    appId: "1:119912523766:web:d6da228bf54b8e30a249d7"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Garantir que o Firebase esteja pronto antes de definir auth e database
const auth = firebase.auth();
const database = firebase.database();

// Função de login
window.login = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = 'links.html';
        })
        .catch((error) => {
            alert('Erro ao fazer login: ' + error.message);
        });
};

// Função de registro com plano gratuito
window.register = function() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const profileRef = database.ref('profile/' + user.uid);
            
            // Aplicar plano gratuito ao finalizar o cadastro
            const initialProfile = {
                plan: 'gratuito',
                theme: 'default'
            };

            return profileRef.set(initialProfile);
        })
        .then(() => {
            window.location.href = 'links.html';
        })
        .catch((error) => {
            console.error('Erro ao cadastrar ou salvar perfil:', error);
            alert('Erro ao cadastrar: ' + error.message);
        });
};

// Alternar entre formulários de login e registro
window.toggleForm = function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
};

// Redirecionar se já estiver autenticado
auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.includes('index.html')) {
        window.location.href = 'links.html';
    }
});