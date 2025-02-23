auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const db = database;
    const usersRef = db.ref('profile');
    const linksRef = db.ref('links');
    const viewsRef = db.ref('views');
    const clicksRef = db.ref('clicks');

    // Verificar se o usuário é admin
    usersRef.child(user.uid).once('value', (snapshot) => {
        const userData = snapshot.val();
        if (!userData || userData.admin !== true) {
            alert('Acesso negado. Apenas administradores podem acessar esta página.');
            window.location.href = 'links.html';
            return;
        }

        // Se for admin, carregar a interface
        const panels = document.querySelectorAll('.panel');
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                navButtons.forEach(btn => btn.classList.remove('active'));
                panels.forEach(panel => panel.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(button.id.replace('-btn', '')).classList.add('active');
            });
        });

        // Dashboard
        function loadDashboard() {
            usersRef.once('value', (snapshot) => {
                const users = snapshot.val();
                let totalUsers = 0;
                let plans = { gratuito: 0, mensal: 0, anual: 0 };
                let revenue = 0;

                for (let uid in users) {
                    totalUsers++;
                    const plan = users[uid].plan || 'gratuito';
                    plans[plan]++;
                    if (plan === 'mensal') revenue += 19.90;
                    if (plan === 'anual') revenue += 190.00;
                }

                document.getElementById('total-users').textContent = totalUsers;
                document.getElementById('active-plans').textContent = `Gratuito: ${plans.gratuito} | Mensal: ${plans.mensal} | Anual: ${plans.anual}`;
                document.getElementById('revenue').textContent = `R$ ${revenue.toFixed(2)}`;
            });
        }

        // Usuários
        function loadUsers() {
            usersRef.once('value', (snapshot) => {
                const users = snapshot.val();
                const tbody = document.getElementById('users-table-body');
                tbody.innerHTML = '';

                for (let uid in users) {
                    const user = users[uid];
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${uid}</td>
                        <td>${user.username || 'Não definido'}</td>
                        <td>${user.email || 'Não definido'}</td>
                        <td>${user.plan || 'gratuito'}</td>
                        <td>${user.blocked ? 'Bloqueado' : 'Ativo'}</td>
                        <td>
                            <button onclick="editUser('${uid}')">Editar</button>
                            <button onclick="toggleBlockUser('${uid}', ${user.blocked || false})">${user.blocked ? 'Desbloquear' : 'Bloquear'}</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                }
            });
        }

        window.editUser = function(uid) {
            const userRef = usersRef.child(uid);
            userRef.once('value', (snapshot) => {
                const user = snapshot.val();
                const newName = prompt('Novo nome:', user.username || '');
                const newEmail = prompt('Novo email:', user.email || '');
                const newPlan = prompt('Novo plano (gratuito, mensal, anual):', user.plan || 'gratuito');

                if (newName || newEmail || newPlan) {
                    userRef.update({
                        username: newName || user.username,
                        email: newEmail || user.email,
                        plan: newPlan || user.plan
                    }).then(() => {
                        alert('Usuário atualizado com sucesso!');
                        loadUsers();
                        loadDashboard();
                    }).catch((error) => alert('Erro ao atualizar usuário: ' + error.message));
                }
            });
        };

        window.toggleBlockUser = function(uid, isBlocked) {
            const userRef = usersRef.child(uid);
            userRef.update({ blocked: !isBlocked }).then(() => {
                alert(`Usuário ${isBlocked ? 'desbloqueado' : 'bloqueado'} com sucesso!`);
                loadUsers();
            }).catch((error) => alert('Erro ao alterar status: ' + error.message));
        };

        // Links
        function loadUsersForLinks() {
            usersRef.once('value', (snapshot) => {
                const users = snapshot.val();
                const select = document.getElementById('user-links-select');
                select.innerHTML = '<option value="">Selecione um usuário</option>';
                for (let uid in users) {
                    const option = document.createElement('option');
                    option.value = uid;
                    option.textContent = users[uid].username || uid;
                    select.appendChild(option);
                }
            });
        }

        document.getElementById('user-links-select').addEventListener('change', (e) => {
            const uid = e.target.value;
            if (uid) loadLinks(uid);
        });

        function loadLinks(uid) {
            linksRef.child(uid).once('value', (snapshot) => {
                const links = snapshot.val() || {};
                const tbody = document.getElementById('links-table-body');
                tbody.innerHTML = '';

                clicksRef.child(uid).once('value', (clickSnapshot) => {
                    const clicks = clickSnapshot.val() || {};

                    for (let linkId in links) {
                        const link = links[linkId];
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${linkId}</td>
                            <td>${link.title}</td>
                            <td>${link.url}</td>
                            <td>${clicks[linkId] || 0}</td>
                            <td>
                                <button onclick="editLink('${uid}', '${linkId}')">Editar</button>
                                <button onclick="deleteLink('${uid}', '${linkId}')">Remover</button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    }
                });
            });
        }

        window.editLink = function(uid, linkId) {
            const linkRef = linksRef.child(uid).child(linkId);
            linkRef.once('value', (snapshot) => {
                const link = snapshot.val();
                const newTitle = prompt('Novo título:', link.title);
                const newUrl = prompt('Nova URL:', link.url);

                if (newTitle || newUrl) {
                    linkRef.update({
                        title: newTitle || link.title,
                        url: newUrl || link.url
                    }).then(() => {
                        alert('Link atualizado com sucesso!');
                        loadLinks(uid);
                    }).catch((error) => alert('Erro ao atualizar link: ' + error.message));
                }
            });
        };

        window.deleteLink = function(uid, linkId) {
            if (confirm('Tem certeza que deseja remover este link?')) {
                linksRef.child(uid).child(linkId).remove().then(() => {
                    alert('Link removido com sucesso!');
                    loadLinks(uid);
                }).catch((error) => alert('Erro ao remover link: ' + error.message));
            }
        };

        document.getElementById('add-link-btn').addEventListener('click', () => {
            const uid = document.getElementById('user-links-select').value;
            if (!uid) return alert('Selecione um usuário primeiro.');
            const title = prompt('Título do novo link:');
            const url = prompt('URL do novo link:');
            if (title && url) {
                linksRef.child(uid).push({ title, url }).then(() => {
                    alert('Link adicionado com sucesso!');
                    loadLinks(uid);
                }).catch((error) => alert('Erro ao adicionar link: ' + error.message));
            }
        });

        // Estatísticas
        function loadStats() {
            usersRef.once('value', (usersSnapshot) => {
                const users = usersSnapshot.val();
                const tbody = document.getElementById('stats-table-body');
                tbody.innerHTML = '';

                viewsRef.once('value', (viewsSnapshot) => {
                    const views = viewsSnapshot.val() || {};
                    clicksRef.once('value', (clicksSnapshot) => {
                        const clicks = clicksSnapshot.val() || {};

                        for (let uid in users) {
                            const userClicks = clicks[uid] || {};
                            let totalClicks = 0;
                            for (let linkId in userClicks) {
                                totalClicks += userClicks[linkId];
                            }

                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${users[uid].username || uid}</td>
                                <td>${views[uid] || 0}</td>
                                <td>${totalClicks}</td>
                            `;
                            tbody.appendChild(tr);
                        }
                    });
                });
            });
        }

        // Exportar Dados
        document.getElementById('export-data-btn').addEventListener('click', () => {
            usersRef.once('value', (snapshot) => {
                const users = snapshot.val();
                let csv = 'UID,Nome,Email,Plano,Status\n';
                for (let uid in users) {
                    const user = users[uid];
                    csv += `${uid},${user.username || ''},${user.email || ''},${user.plan || 'gratuito'},${user.blocked ? 'Bloqueado' : 'Ativo'}\n`;
                }
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'linkly_users.csv';
                a.click();
                window.URL.revokeObjectURL(url);
            });
        });

        // Resetar Estatísticas
        document.getElementById('reset-stats-btn').addEventListener('click', () => {
            if (confirm('Tem certeza que deseja resetar todas as estatísticas? Isso não pode ser desfeito.')) {
                viewsRef.set({}).then(() => {
                    clicksRef.set({}).then(() => {
                        alert('Estatísticas resetadas com sucesso!');
                        loadDashboard();
                        loadStats();
                    }).catch((error) => alert('Erro ao resetar cliques: ' + error.message));
                }).catch((error) => alert('Erro ao resetar visualizações: ' + error.message));
            }
        });

        // Logout
        window.logout = function() {
            auth.signOut().then(() => window.location.href = 'index.html')
                .catch((error) => alert('Erro ao sair: ' + error.message));
        };

        // Carregar dados iniciais
        loadDashboard();
        loadUsers();
        loadUsersForLinks();
        loadStats();
    });
});