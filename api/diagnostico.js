export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { falla } = req.body;
  if (!falla) return res.status(400).json({error:'Falta descripcion'});
  try {
    if (process.env.GROQ_API_KEY) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {role:'system', content:'Sos Motoras IA, mecánico experto argentino. Diagnostica fallas en 3 pasos: causa probable, gravedad, costo estimado en ARS y USD.'},
            {role:'user', content: falla}
          ]
        })
      });
      const data = await r.json();
      const txt = data.choices?.[0]?.message?.content || 'No se pudo diagnosticar';
      return res.status(200).json({ diagnostico: txt });
    }
  } catch(e) {}
  return res.status(200).json({ diagnostico: `🔧 Diagnóstico preliminar para: "${falla}"\n\nCausa probable: Desgaste o falla sensorial\nGravedad: Media\nCosto estimado: $45.000 ARS / 30 USD\n\nRecomendación: Agendá mecánico a domicilio desde Motoras.` });
    }
