export const config = { runtime: 'nodejs' };
export default async function handler(req, res) {
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares/blue');
    const d = await r.json();
    return res.status(200).json({ venta: d.venta, compra: d.compra });
  } catch (e) { return res.status(200).json({ venta: 1450 }); }
}
