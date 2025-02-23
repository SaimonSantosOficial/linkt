const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const accessToken = 'APP_USR-2492261528905302-022313-847ddf36b1e4b78af3a81209cac29a76-1362357526';

// Pagamento com cartão
app.post('/create-payment', async (req, res) => {
    const { amount, token, description, payer_email } = req.body;

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
                token: token,
                description: description,
                payment_method_id: 'visa', // Exemplo, pode ser dinâmico
                payer: { email: payer_email },
                installments: 1
            })
        });

        const data = await response.json();
        if (response.ok) {
            res.json(data);
        } else {
            res.status(response.status).json({ error: data.message });
        }
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        res.status(500).json({ error: 'Erro ao processar pagamento' });
    }
});

// Pagamento com Pix
app.post('/create-pix-payment', async (req, res) => {
    const { amount, description, payer_email } = req.body;

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
                payer: { email: payer_email }
            })
        });

        const data = await response.json();
        if (response.ok) {
            res.json(data);
        } else {
            res.status(response.status).json({ error: data.message });
        }
    } catch (error) {
        console.error('Erro ao criar pagamento Pix:', error);
        res.status(500).json({ error: 'Erro ao gerar Pix' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});