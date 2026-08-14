export const config = { runtime: 'nodejs' };
async function obtenerDolarBlue() {
  try { const r = await fetch('https://dolarapi.com/v1/dolares/blue'); const d = await r.json(); return d.venta || 1450; }
  catch { return 1450; }
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const dolar = await obtenerDolarBlue();
    const precioARS = Math.round(dolar * 3);
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      body: JSON.stringify({
        items: [{ title: 'Diagnóstico Motoras IA - 3 USD', quantity: 1, unit_price: precioARS, currency_id: 'ARS' }],
        back_urls: { success: `${process.env.BASE_URL}/?pago=exito`, failure: `${process.env.BASE_URL}/?pago=fallo`, pending: `${process.env.BASE_URL}/?pago=pendiente` },
        auto_return: 'approved'
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: JSON.stringify(data) });
    return res.status(200).json({ init_point: data.init_point, precioARS, dolar });
  } catch (e) { return res.status(500).json({ error: e.message }); }
                                                   }
