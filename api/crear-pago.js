export const config = { runtime: 'nodejs' };

async function obtenerDolarBlue() {
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares/blue', { cache: 'no-store' });
    const d = await r.json();
    return d.venta || 1450;
  } catch {
    return 1450;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Content-Type','application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'Falta MP_ACCESS_TOKEN en Vercel > Settings > Environment Variables. Poné tu token de Mercado Pago.' });
    }
    const baseUrl = process.env.BASE_URL || 'https://www.motoras.com.ar';
    const dolar = await obtenerDolarBlue();
    const precioARS = Math.round(dolar * 3);
    
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        items: [{
          title: 'Diagnóstico Motoras IA - 3 USD',
          quantity: 1,
          unit_price: precioARS,
          currency_id: 'ARS'
        }],
        back_urls: {
          success: `${baseUrl}/?pago=exito`,
          failure: `${baseUrl}/?pago=fallo`,
          pending: `${baseUrl}/?pago=pendiente`
        },
        auto_return: 'approved'
      })
    });
    
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { return res.status(500).json({ error: 'MercadoPago devolvió HTML: ' + text.slice(0,200) }); }
    
    if (!response.ok) {
      return res.status(500).json({ error: data.message || JSON.stringify(data) });
    }
    return res.status(200).json({ init_point: data.init_point, id: data.id, precioARS, dolar });
  } catch (e) {
    return res.status(500).json({ error: 'Error interno crear-pago: ' + e.message });
  }
          }
