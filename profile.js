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
const database = firebase.database();

const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('uid');

function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function adjustTextColor(bgColor) {
    let r, g, b;
    if (bgColor.includes('linear-gradient')) {
        const match = bgColor.match(/#([0-9a-fA-F]{6})/);
        const hex = match ? match[1] : '1a1a2e';
        r = parseInt(hex.substr(0, 2), 16);
        g = parseInt(hex.substr(2, 2), 16);
        b = parseInt(hex.substr(4, 2), 16);
    } else {
        const hex = bgColor.replace('#', '');
        r = parseInt(hex.substr(0, 2), 16);
        g = parseInt(hex.substr(2, 2), 16);
        b = parseInt(hex.substr(4, 2), 16);
    }

    const luminance = getLuminance(r, g, b);
    return luminance > 0.5 ? '#1a1a2e' : '#ffffff';
}

if (!uid) {
    document.body.innerHTML = '<h1>Perfil não encontrado</h1>';
} else {
    const linksRef = database.ref('links/' + uid);
    const profileRef = database.ref('profile/' + uid);
    const viewsRef = database.ref('views/' + uid);
    const clicksRef = database.ref('clicks/' + uid);

    viewsRef.transaction((currentViews) => {
        return (currentViews || 0) + 1;
    }).catch((error) => {
        console.error('Erro ao atualizar visualizações:', error);
    });

    linksRef.once('value', (snapshot) => {
        const links = snapshot.val() || {};
        const linkList = document.getElementById('profileLinkList');
        linkList.innerHTML = '';

        for (let key in links) {
            const link = links[key];
            const div = document.createElement('div');
            div.classList.add('profile-link-item');

            if (link.image) {
                const img = document.createElement('img');
                img.src = link.image;
                div.appendChild(img);
            }

            const a = document.createElement('a');
            a.href = link.url;
            a.textContent = link.title;
            a.target = '_blank';
            a.onclick = () => {
                clicksRef.child(key).transaction((clicks) => {
                    return (clicks || 0) + 1;
                });
            };
            div.appendChild(a);

            linkList.appendChild(div);
        }

        if (!Object.keys(links).length) {
            linkList.innerHTML = '<p>Este perfil ainda não tem links.</p>';
        }
    }, (error) => {
        console.error('Erro ao carregar links:', error);
        document.getElementById('profileLinkList').innerHTML = '<p>Erro ao carregar links.</p>';
    });

    const themes = {
        'default': { bg: 'linear-gradient(135deg, #1a1a2e, #16213e)', text: '#e0e0e0' },
        'midnight': { bg: 'linear-gradient(135deg, #0a0a1a, #1a1a2e)', text: '#d0d0e0' },
        'sunset': { bg: 'linear-gradient(135deg, #ff4500, #ff8c00)', text: '#ffffff' },
        'forest': { bg: 'linear-gradient(135deg, #2f4f4f, #006400)', text: '#e6f3e6' },
        'ocean': { bg: 'linear-gradient(135deg, #00b7eb, #1e90ff)', text: '#ffffff' }
    };

    profileRef.once('value', (snapshot) => {
        const profile = snapshot.val() || { plan: 'gratuito', theme: 'default' };
        document.getElementById('profileName').textContent = profile.username || 'Usuário do Link.ly';
        document.getElementById('profileBio').textContent = profile.bio || '';
        if (profile.categories) {
            document.getElementById('profileCategories').textContent = profile.categories.join(', ');
        }
        if (profile.profilePic) {
            document.getElementById('profilePic').src = profile.profilePic;
        }
        if (profile.coverPic) {
            document.getElementById('coverPhoto').style.backgroundImage = `url(${profile.coverPic})`;
        }

        const selectedTheme = themes[profile.theme] || themes['default'];
        document.body.style.background = selectedTheme.bg;

        const textColor = adjustTextColor(selectedTheme.bg);
        document.body.style.color = textColor;
        document.querySelector('.profile-header h1').style.color = textColor === '#ffffff' ? '#ffd700' : '#ffd700';
        document.querySelector('.profile-header .bio').style.color = textColor;
        document.querySelector('.profile-header .categories').style.color = textColor === '#ffffff' ? '#a0a0c0' : '#a0a0c0';
        document.querySelector('.profile-header .views').style.color = textColor === '#ffffff' ? '#ffd700' : '#ffd700';

        if (profile.plan !== 'gratuito') {
            document.getElementById('verifiedBadge').style.display = 'inline';
            document.querySelector('.watermark').style.display = 'none';
        } else {
            // Garantir que o tema padrão seja aplicado ao carregar plano gratuito
            document.body.style.background = themes['default'].bg;
            document.body.style.color = themes['default'].text;
            document.body.classList.remove('premium-theme');
            document.querySelector('.watermark').style.display = 'block';
            document.getElementById('verifiedBadge').style.display = 'none';
        }

        if (profile.plan === 'anual') {
            document.body.classList.add('premium-theme');
        }
    }, (error) => {
        console.error('Erro ao carregar perfil:', error);
    });

    viewsRef.on('value', (snapshot) => {
        const views = snapshot.val() || 0;
        document.getElementById('profileViews').textContent = `Visualizações: ${views}`;
    }, (error) => {
        console.error('Erro ao carregar visualizações:', error);
        document.getElementById('profileViews').textContent = 'Erro ao carregar visualizações';
    });
}