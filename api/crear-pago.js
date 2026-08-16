export const config = { runtime: 'nodejs' };
async function obtenerDolarBlue() {
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares/blue');
    const d = await r.json();
    return d.venta || 1450;
  } catch {
    return 1450;
  }
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    if (!process.env.MP_ACCESS_TOKEN) throw new Error('Falta MP_ACCESS_TOKEN en Vercel Env');
    const baseUrl = process.env.BASE_URL || 'https://www.motoras.com.ar';
    const dolar = await obtenerDolarBlue();
    const precioARS = Math.round(dolar * 3);
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      body: JSON.stringify({
        items: [{ title: 'Diagnóstico Motoras IA - 3 USD', quantity: 1, unit_price: precioARS, currency_id: 'ARS' }],
        back_urls: { success: `${baseUrl}/?pago=exito`, failure: `${baseUrl}/?pago=fallo`, pending: `${baseUrl}/?pago=pendiente` },
        auto_return: 'approved'
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.message || JSON.stringify(data) });
    return res.status(200).json({ init_point: data.init_point, id: data.id, precioARS, dolar });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
