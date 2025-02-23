auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const profileRef = database.ref('profile/' + user.uid);

    document.querySelectorAll('.choose-plan').forEach(button => {
        button.addEventListener('click', (e) => {
            const planCard = e.target.closest('.plan-card');
            const plan = planCard.querySelector('h2').textContent.toLowerCase();
            const priceText = planCard.querySelector('.price').textContent.split('/')[0].trim();
            const updateData = { plan: plan };

            if (plan === 'gratuito') {
                updateData.theme = 'default';
                profileRef.once('value', (snapshot) => {
                    if (snapshot.exists()) {
                        profileRef.update(updateData)
                            .then(() => {
                                alert('Plano Gratuito ativado com sucesso! Tema resetado para Padrão.');
                                window.location.href = 'links.html';
                            })
                            .catch((error) => {
                                console.error('Erro ao atualizar plano:', error);
                                alert('Erro ao ativar plano.');
                            });
                    } else {
                        profileRef.set(updateData)
                            .then(() => {
                                alert('Plano Gratuito ativado com sucesso! Tema resetado para Padrão.');
                                window.location.href = 'links.html';
                            })
                            .catch((error) => {
                                console.error('Erro ao criar perfil com plano:', error);
                                alert('Erro ao ativar plano.');
                            });
                    }
                });
            } else {
                const price = plan === 'mensal' ? '19.90' : '190.00';
                window.location.href = `payment.html?plan=${plan}&price=${price}&uid=${user.uid}`;
            }
        });
    });

    window.updatePlanAfterPayment = function(plan) {
        const updateData = { plan: plan };
        profileRef.update(updateData)
            .then(() => {
                alert(`Plano ${plan} ativado com sucesso!`);
                window.location.href = 'links.html';
            })
            .catch((error) => {
                console.error('Erro ao atualizar plano após pagamento:', error);
                alert('Erro ao ativar plano.');
            });
    };
});