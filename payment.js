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

    // Inicializar Mercado Pago com Public Key
    window.Mercadopago.setPublishableKey('APP_USR-1eabf3e0-3a7e-4c34-bdec-aed3958ebfc3');

    const form = document.getElementById('payment-form');
    const pixBtn = document.getElementById('pix-btn');
    const pixQrCode = document.getElementById('pix-qr-code');
    const confirmPixBtn = document.getElementById('confirm-pix-btn');
    const errorElement = document.getElementById('payment-errors');

    // Pagamento com cartão
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const cardNumber = document.getElementById('cardNumber').value;
        const cardExpiry = document.getElementById('cardExpiry').value;
        const cardCvc = document.getElementById('cardCvc').value;

        window.Mercadopago.createToken({
            cardNumber: cardNumber.replace(/\s/g, ''),
            cardExpirationMonth: cardExpiry.split('/')[0].trim(),
            cardExpirationYear: cardExpiry.split('/')[1].trim(),
            securityCode: cardCvc
        }, async (status, response) => {
            if (status !== 200 && status !== 201) {
                errorElement.textContent = response.cause[0].description || 'Erro ao processar cartão.';
                return;
            }

            const token = response.id;

            // Enviar token para o backend
            const paymentResponse = await fetch('http://localhost:3000/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(price),
                    token: token,
                    description: `Plano ${plan} - Link.ly`,
                    payer_email: user.email
                })
            });

            const paymentData = await paymentResponse.json();
            if (paymentResponse.ok && paymentData.status === 'approved') {
                window.updatePlanAfterPayment(plan);
            } else {
                errorElement.textContent = paymentData.error || 'Erro ao processar pagamento com cartão.';
            }
        });
    });

    // Pagamento com Pix
    pixBtn.addEventListener('click', async () => {
        pixQrCode.style.display = 'block';
        form.style.display = 'none';

        const pixResponse = await fetch('http://localhost:3000/create-pix-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: parseFloat(price),
                description: `Plano ${plan} - Link.ly`,
                payer_email: user.email
            })
        });

        const pixData = await pixResponse.json();
        if (pixResponse.ok && pixData.point_of_interaction) {
            const qrCodeBase64 = pixData.point_of_interaction.transaction_data.qr_code_base64;
            document.getElementById('qrCodeImage').src = `data:image/png;base64,${qrCodeBase64}`;
        } else {
            errorElement.textContent = pixData.error || 'Erro ao gerar QR Code Pix.';
        }
    });

    confirmPixBtn.addEventListener('click', async () => {
        // Simulação de confirmação (em produção, verificar status via API)
        window.updatePlanAfterPayment(plan);
    });
});

const script = document.createElement('script');
script.src = 'plans.js';
document.body.appendChild(script);