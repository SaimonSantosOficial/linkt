auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    const price = urlParams.get('price');
    const uid = urlParams.get('uid');

    if (!plan || !price || !uid) {
        alert('Plano, preço ou UID inválido.');
        window.location.href = 'plans.html';
        return;
    }

    document.getElementById('planName').textContent = `Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
    document.getElementById('planPrice').textContent = `R$ ${price}${plan === 'mensal' ? '/mês' : '/ano'}`;

    const pixBtn = document.getElementById('pix-btn');
    const pixQrCode = document.getElementById('pix-qr-code');
    const pixCodeInput = document.getElementById('pixCode');
    const copyPixBtn = document.getElementById('copy-pix-btn');
    const pixTimer = document.getElementById('pix-timer');
    const paymentStatus = document.getElementById('payment-status');
    const errorElement = document.getElementById('payment-errors');

    let paymentId = null;
    let timerInterval = null;
    let pollingInterval = null;

    // Substitua pela URL do seu backend hospedado (exemplo com Render)
    const backendUrl = 'https://linkly-backend.onrender.com'; // Atualize com sua URL real

    pixBtn.addEventListener('click', async () => {
        pixQrCode.style.display = 'block';
        pixBtn.style.display = 'none';

        try {
            const response = await fetch(`${backendUrl}/create-pix-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(price),
                    description: `Plano ${plan} - Link.ly`,
                    payer_email: user.email
                })
            });

            console.log('Status da resposta do backend:', response.status);
            const data = await response.json();
            console.log('Dados retornados do backend:', data);

            if (response.ok && data.point_of_interaction) {
                const qrCodeBase64 = data.point_of_interaction.transaction_data.qr_code_base64;
                const pixCode = data.point_of_interaction.transaction_data.qr_code;
                const expirationDate = new Date(data.date_of_expiration);
                paymentId = data.id;

                document.getElementById('qrCodeImage').src = `data:image/png;base64,${qrCodeBase64}`;
                pixCodeInput.value = pixCode;

                const updateTimer = () => {
                    const now = new Date();
                    const timeLeft = expirationDate - now;
                    if (timeLeft <= 0) {
                        pixTimer.textContent = 'Expirado';
                        clearInterval(timerInterval);
                        clearInterval(pollingInterval);
                        paymentStatus.textContent = 'Tempo expirado. Gere um novo Pix.';
                    } else {
                        const hours = Math.floor(timeLeft / 3600000);
                        const minutes = Math.floor((timeLeft % 3600000) / 60000);
                        const seconds = Math.floor((timeLeft % 60000) / 1000);
                        pixTimer.textContent = `${hours}h ${minutes}m ${seconds}s`;
                    }
                };
                updateTimer();
                timerInterval = setInterval(updateTimer, 1000);

                paymentStatus.textContent = 'Aguardando pagamento...';
                pollingInterval = setInterval(async () => {
                    const statusResponse = await fetch(`${backendUrl}/check-pix-status/${paymentId}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const statusData = await statusResponse.json();

                    console.log('Status do pagamento:', statusData.status);

                    if (statusResponse.ok && statusData.status === 'approved') {
                        clearInterval(pollingInterval);
                        clearInterval(timerInterval);
                        paymentStatus.textContent = 'Pagamento confirmado!';
                        window.updatePlanAfterPayment(plan);
                    } else if (statusData.status === 'rejected') {
                        clearInterval(pollingInterval);
                        clearInterval(timerInterval);
                        paymentStatus.textContent = 'Pagamento rejeitado.';
                    }
                }, 5000);
            } else {
                errorElement.textContent = data.error || 'Erro ao gerar QR Code Pix.';
            }
        } catch (error) {
            console.error('Erro ao conectar-se ao backend:', error);
            errorElement.textContent = 'Erro ao conectar com o servidor. Tente novamente.';
        }
    });

    copyPixBtn.addEventListener('click', () => {
        pixCodeInput.select();
        navigator.clipboard.writeText(pixCodeInput.value)
            .then(() => alert('Código Pix copiado!'))
            .catch(() => alert('Erro ao copiar código Pix.'));
    });
});

const script = document.createElement('script');
script.src = 'plans.js';
document.body.appendChild(script);