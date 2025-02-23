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

auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const linksRef = database.ref('links/' + user.uid);
    const profileRef = database.ref('profile/' + user.uid);
    const clicksRef = database.ref('clicks/' + user.uid);
    const viewsRef = database.ref('views/' + user.uid);

    document.getElementById('shareLink').value = `${window.location.origin}/profile.html?uid=${user.uid}`;

    const themes = {
        'default': { bg: 'linear-gradient(135deg, #1a1a2e, #16213e)', text: '#e0e0e0' },
        'midnight': { bg: 'linear-gradient(135deg, #0a0a1a, #1a1a2e)', text: '#d0d0e0' },
        'sunset': { bg: 'linear-gradient(135deg, #ff4500, #ff8c00)', text: '#ffffff' },
        'forest': { bg: 'linear-gradient(135deg, #2f4f4f, #006400)', text: '#e6f3e6' },
        'ocean': { bg: 'linear-gradient(135deg, #00b7eb, #1e90ff)', text: '#ffffff' }
    };

    profileRef.once('value', (snapshot) => {
        let profile = snapshot.val();
        if (!profile) {
            // Se o nó profile não existe, criar com plano gratuito como padrão
            profile = { plan: 'gratuito', theme: 'default' };
            profileRef.set(profile);
        }
        document.getElementById('username').value = profile.username || '';
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('profilePicUrl').value = profile.profilePic || '';
        document.getElementById('coverPicUrl').value = profile.coverPic || '';
        document.getElementById('theme').value = profile.theme || 'default';
        const categories = profile.categories || [];
        const select = document.getElementById('categories');
        Array.from(select.options).forEach(option => {
            option.selected = categories.includes(option.value);
        });

        const selectedTheme = themes[profile.theme] || themes['default'];
        document.body.style.background = selectedTheme.bg;
        document.body.style.color = selectedTheme.text;

        if (profile.plan !== 'gratuito') {
            document.getElementById('theme').disabled = false;
        } else {
            document.getElementById('theme').disabled = true;
            document.body.style.background = themes['default'].bg;
            document.body.style.color = themes['default'].text;
            document.body.classList.remove('premium-theme');
        }

        if (profile.plan === 'anual') {
            document.body.classList.add('premium-theme');
        }
    });

    let linkCount = 0;
    const maxFreeLinks = 5;

    function updateLinkCount(count, plan) {
        const linkCountSpan = document.getElementById('linkCount');
        if (plan === 'gratuito') {
            linkCountSpan.textContent = `(${count}/${maxFreeLinks})`;
            if (count >= maxFreeLinks) {
                document.getElementById('addLinkBtn').disabled = true;
                document.getElementById('addLinkBtn').style.opacity = 0.5;
            } else {
                document.getElementById('addLinkBtn').disabled = false;
                document.getElementById('addLinkBtn').style.opacity = 1;
            }
        } else {
            linkCountSpan.textContent = `(${count}/∞)`;
            document.getElementById('addLinkBtn').disabled = false;
            document.getElementById('addLinkBtn').style.opacity = 1;
        }
    }

    function loadLinks() {
        const linkList = document.getElementById('linkList');
        linksRef.orderByChild('order').on('value', (snapshot) => {
            linkList.innerHTML = '';
            const links = snapshot.val() || {};
            const linkArray = [];
            for (let key in links) {
                linkArray.push({ key, ...links[key] });
            }
            linkArray.sort((a, b) => (a.order || 0) - (b.order || 0));
            linkCount = linkArray.length;
            profileRef.once('value', (profileSnapshot) => {
                const profile = profileSnapshot.val() || { plan: 'gratuito' };
                updateLinkCount(linkCount, profile.plan);

                linkArray.forEach((link, index) => {
                    const div = document.createElement('div');
                    div.classList.add('link-item');
                    div.dataset.key = link.key;

                    if (link.image) {
                        const img = document.createElement('img');
                        img.src = link.image;
                        div.appendChild(img);
                    }

                    const a = document.createElement('a');
                    a.href = link.url;
                    a.textContent = link.title;
                    a.target = '_blank';
                    a.style.color = 'inherit';
                    a.style.textDecoration = 'none';

                    const span = document.createElement('span');
                    span.appendChild(a);

                    const moveUpBtn = document.createElement('button');
                    moveUpBtn.textContent = '↑';
                    moveUpBtn.classList.add('move-btn');
                    moveUpBtn.onclick = () => moveLink(link.key, index, -1);

                    const moveDownBtn = document.createElement('button');
                    moveDownBtn.textContent = '↓';
                    moveDownBtn.classList.add('move-btn');
                    moveDownBtn.onclick = () => moveLink(link.key, index, 1);

                    const editBtn = document.createElement('button');
                    editBtn.textContent = 'Editar';
                    editBtn.onclick = () => editLink(link.key, link.title, link.url, link.image);

                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Remover';
                    deleteBtn.onclick = () => deleteLink(link.key);

                    div.appendChild(span);
                    div.appendChild(moveUpBtn);
                    div.appendChild(moveDownBtn);

                    if (profile.plan !== 'gratuito') {
                        clicksRef.child(link.key).on('value', (clickSnapshot) => {
                            const clicks = clickSnapshot.val() || 0;
                            const clickSpan = div.querySelector('.click-count') || document.createElement('span');
                            clickSpan.classList.add('click-count');
                            clickSpan.textContent = `Cliques: ${clicks}`;
                            div.appendChild(clickSpan);
                        });
                    }

                    div.appendChild(editBtn);
                    div.appendChild(deleteBtn);
                    linkList.appendChild(div);
                });
            });
        }, (error) => {
            console.error('Erro ao carregar links:', error);
            alert('Erro ao carregar links.');
        });
    }

    window.addOrUpdateLink = function() {
        const title = document.getElementById('linkTitle').value.trim();
        const url = document.getElementById('linkUrl').value.trim();
        const image = document.getElementById('linkImage').value.trim();

        if (!title || !url) {
            alert('Preencha título e URL!');
            return;
        }

        profileRef.once('value', (snapshot) => {
            const profile = snapshot.val() || { plan: 'gratuito' };
            if (profile.plan === 'gratuito' && linkCount >= maxFreeLinks && !document.getElementById('linkTitle').dataset.key) {
                alert('Limite de 5 links atingido no plano gratuito. Faça upgrade para adicionar mais!');
                return;
            }

            const newLink = { title, url, order: linkCount };
            if (image) newLink.image = image;

            const key = document.getElementById('linkTitle').dataset.key;

            if (key) {
                linksRef.child(key).update(newLink)
                    .then(() => {
                        resetLinkForm();
                        console.log('Link atualizado com sucesso!');
                    })
                    .catch((error) => {
                        console.error('Erro ao atualizar link:', error);
                        alert('Erro ao atualizar link.');
                    });
            } else {
                linksRef.push(newLink)
                    .then(() => {
                        resetLinkForm();
                        console.log('Link adicionado com sucesso!');
                    })
                    .catch((error) => {
                        console.error('Erro ao adicionar link:', error);
                        alert('Erro ao adicionar link.');
                    });
            }
        });
    };

    window.moveLink = function(key, currentIndex, direction) {
        linksRef.once('value', (snapshot) => {
            const links = snapshot.val() || {};
            const linkArray = [];
            for (let k in links) {
                linkArray.push({ key: k, ...links[k] });
            }
            linkArray.sort((a, b) => (a.order || 0) - (b.order || 0));

            const newIndex = currentIndex + direction;
            if (newIndex < 0 || newIndex >= linkArray.length) return;

            const currentLink = linkArray[currentIndex];
            const targetLink = linkArray[newIndex];

            const currentOrder = currentLink.order || currentIndex;
            const targetOrder = targetLink.order || newIndex;

            linksRef.child(currentLink.key).update({ order: targetOrder });
            linksRef.child(targetLink.key).update({ order: currentOrder });
        });
    };

    window.editLink = function(key, title, url, image) {
        document.getElementById('linkTitle').value = title;
        document.getElementById('linkUrl').value = url;
        document.getElementById('linkImage').value = image || '';
        document.getElementById('linkTitle').dataset.key = key;
    };

    window.deleteLink = function(key) {
        if (confirm('Tem certeza que deseja remover este link?')) {
            linksRef.child(key).remove()
                .then(() => {
                    console.log('Link removido com sucesso!');
                })
                .catch((error) => {
                    console.error('Erro ao remover link:', error);
                    alert('Erro ao remover link.');
                });
        }
    };

    function resetLinkForm() {
        document.getElementById('linkTitle').value = '';
        document.getElementById('linkUrl').value = '';
        document.getElementById('linkImage').value = '';
        delete document.getElementById('linkTitle').dataset.key;
    }

    window.saveProfile = function() {
        const username = document.getElementById('username').value.trim();
        const bio = document.getElementById('bio').value.trim();
        const profilePic = document.getElementById('profilePicUrl').value.trim();
        const coverPic = document.getElementById('coverPicUrl').value.trim();
        const theme = document.getElementById('theme').value;
        const select = document.getElementById('categories');
        const selectedCategories = Array.from(select.selectedOptions).map(option => option.value);

        if (!username) {
            alert('Preencha o nome de usuário!');
            return;
        }

        if (selectedCategories.length > 3) {
            alert('Selecione no máximo 3 categorias!');
            return;
        }

        const profileData = { username };
        if (bio) profileData.bio = bio;
        if (profilePic) profileData.profilePic = profilePic;
        if (coverPic) profileData.coverPic = coverPic;
        if (!document.getElementById('theme').disabled && theme) {
            profileData.theme = theme;
            const selectedTheme = themes[theme];
            document.body.style.background = selectedTheme.bg;
            document.body.style.color = selectedTheme.text;
        }
        if (selectedCategories.length) profileData.categories = selectedCategories;

        profileRef.set(profileData)
            .then(() => {
                alert('Perfil salvo com sucesso!');
            })
            .catch((error) => {
                console.error('Erro ao salvar perfil:', error);
                alert('Erro ao salvar perfil.');
            });
    };

    window.logout = function() {
        auth.signOut()
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Erro ao sair:', error);
                alert('Erro ao sair.');
            });
    };

    window.copyShareLink = function() {
        const shareLink = document.getElementById('shareLink');
        shareLink.select();
        navigator.clipboard.writeText(shareLink.value)
            .then(() => {
                alert('Link copiado para a área de transferência!');
            })
            .catch((error) => {
                console.error('Erro ao copiar link:', error);
                alert('Erro ao copiar link. Aqui está ele: ' + shareLink.value);
            });
    };

    window.confirmDeleteAccount = function() {
        if (confirm('Tem certeza que deseja deletar sua conta permanentemente? Esta ação não pode ser desfeita.')) {
            const user = auth.currentUser;
            linksRef.remove()
                .then(() => profileRef.remove())
                .then(() => clicksRef.remove())
                .then(() => viewsRef.remove())
                .then(() => user.delete())
                .then(() => {
                    alert('Conta deletada com sucesso.');
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error('Erro ao deletar conta:', error);
                    alert('Erro ao deletar conta: ' + error.message);
                });
        }
    };

    loadLinks();
});