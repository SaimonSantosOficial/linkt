const express = require('express');
const fetch = require('node-fetch').default;
const cors = require('cors');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const accessToken = 'APP_USR-2492261528905302-022313-847ddf36b1e4b78af3a81209cac29a76-1362357526';

app.post('/create-pix-payment', async (req, res) => {
    const { amount, description, payer_email } = req.body;

    console.log('Requisição de pagamento Pix recebida:', req.body);

    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 15);

    try {
        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `${Date.now()}`
            },
            body: JSON.stringify({
                transaction_amount: amount,
                description: description,
                payment_method_id: 'pix',
                payer: { email: payer_email },
                date_of_expiration: expirationDate.toISOString()
            })
        });

        console.log('Status da resposta do Mercado Pago:', response.status);
        const data = await response.json();

        if (response.ok) {
            console.log('Pagamento Pix criado com sucesso:', data);
            res.json(data);
        } else {
            console.error('Erro retornado pelo Mercado Pago:', data);
            res.status(response.status).json({ error: data.message || 'Erro ao gerar Pix' });
        }
    } catch (error) {
        console.error('Erro ao criar pagamento Pix:', error.message);
        res.status(500).json({ error: 'Erro ao gerar Pix: ' + error.message });
    }
});

app.get('/check-pix-status/:paymentId', async (req, res) => {
    const { paymentId } = req.params;

    try {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Status da verificação do pagamento:', response.status);
        const data = await response.json();

        if (response.ok) {
            res.json({ status: data.status });
        } else {
            console.error('Erro ao verificar status:', data);
            res.status(response.status).json({ error: data.message || 'Erro ao verificar status' });
        }
    } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error.message);
        res.status(500).json({ error: 'Erro ao verificar status: ' + error.message });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});