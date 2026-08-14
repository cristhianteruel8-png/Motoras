export const config = { runtime: 'nodejs' };
function getPaypalBase() { return process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'; }
async function obtenerAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const resp = await fetch(`${getPaypalBase()}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  const data = await resp.json(); if (!resp.ok) throw new Error(JSON.stringify(data)); return data.access_token;
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const { orderID } = req.query; const token = await obtenerAccessToken();
    const captureResp = await fetch(`${getPaypalBase()}/v2/checkout/orders/${orderID}/capture`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
    const captureData = await captureResp.json(); return res.status(200).json({ status: captureData.status, data: captureData });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
