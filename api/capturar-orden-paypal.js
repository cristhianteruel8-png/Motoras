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
    const { orderID } = req.query;
    const accessToken = await obtenerAccessToken();

    const captureResp = await fetch(
      'https://api-m.sandbox.paypal.com/v2/checkout/orders/' + orderID + '/capture',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken
        }
      }
    );

    const captureData = await captureResp.json();

    if (!captureResp.ok) {
      res.status(500).json({ error: captureData.message || 'Error capturando el pago' });
      return;
    }

    res.status(200).json({ status: captureData.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  }
