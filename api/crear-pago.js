export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.MP_ACCESS_TOKEN
      },
      body: JSON.stringify({
        items: [
          {
            title: 'Diagnóstico Motoras IA',
            quantity: 1,
            unit_price: 3000,
            currency_id: 'ARS'
          }
        ],
        back_urls: {
          success: 'https://www.motoras.com.ar/?pago=exito',
          failure: 'https://www.motoras.com.ar/?pago=fallo',
          pending: 'https://www.motoras.com.ar/?pago=pendiente'
        },
        auto_return: 'approved'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(500).json({ error: data.message || 'Error creando el pago' });
      return;
    }

    res.status(200).json({ init_point: data.init_point });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
