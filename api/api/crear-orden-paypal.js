async function obtenerAccessToken() {
  const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_SECRET).toString('base64');
  const resp = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + auth,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await resp.json();
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const accessToken = await obtenerAccessToken();

    const orderResp = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: '3.00' },
            description: 'Diagnóstico Motoras IA'
          }
        ]
      })
    });

    const orderData = await orderResp.json();

    if (!orderResp.ok) {
      res.status(500).json({ error: orderData.message || 'Error creando la orden' });
      return;
    }

    res.status(200).json({ id: orderData.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
