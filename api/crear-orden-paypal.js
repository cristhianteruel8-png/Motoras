export const config = { runtime: 'nodejs' };
function getPaypalBase() {
  const env = process.env.PAYPAL_ENV || 'sandbox';
  return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}
async function obtenerAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!id || !secret) throw new Error(`Faltan credenciales en Vercel: CLIENT_ID=${id?'OK':'FALTA'} SECRET=${secret?'OK':'FALTA'} - Agregalas en Settings > Environment Variables`);
  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  const resp = await fetch(`${getPaypalBase()}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`PayPal auth failed en ${process.env.PAYPAL_ENV||'sandbox'}: ${JSON.stringify(data)}`);
  return data.access_token;
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const token = await obtenerAccessToken();
    const orderResp = await fetch(`${getPaypalBase()}/v2/checkout/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ intent: 'CAPTURE', purchase_units: [{ amount: { currency_code: 'USD', value: '3.00' }, description: 'Motoras IA' }] }) });
    const orderData = await orderResp.json();
    if (!orderResp.ok) return res.status(500).json({ error: JSON.stringify(orderData) });
    return res.status(200).json({ id: orderData.id });
  } catch (e) { return res.status(500).json({ error: e.message }); }
                                                         }
