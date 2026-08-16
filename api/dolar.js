export const config = { runtime: 'nodejs' };
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares/blue');
    const d = await r.json();
    return res.status(200).json({ venta: d.venta, compra: d.compra, fecha: d.fechaActualizacion });
  } catch (e) {
    try {
      const r2 = await fetch('https://api.bluelytics.com.ar/v2/latest');
      const d2 = await r2.json();
      return res.status(200).json({ venta: d2.blue.value_sell, compra: d2.blue.value_buy });
    } catch {
      return res.status(200).json({ venta: 1450, compra: 1430 });
    }
  }
}
