export const config = { runtime: 'nodejs' };
function getPaypalBase() {
  return process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}
async function obtenerAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!id || !secret) throw new Error('Faltan PAYPAL_CLIENT_ID o SECRET');
  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  const resp = await fetch(`${getPaypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(JSON.stringify(data));
  return data.access_token;
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const { orderID } = req.query;
    if (!orderID) return res.status(400).json({ error: 'Falta orderID' });
    const accessToken = await obtenerAccessToken();
    const captureResp = await fetch(`${getPaypalBase()}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }
    });
    const captureData = await captureResp.json();
    if (!captureResp.ok) return res.status(500).json({ error: captureData.message || JSON.stringify(captureData) });
    return res.status(200).json({ status: captureData.status, data: captureData });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
