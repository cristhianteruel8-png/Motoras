export const config = { runtime: 'nodejs' };
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'No permitido'});
  try{
    const base=process.env.BASE_URL||'https://www.motoras.com.ar';
    const r=await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.MP_ACCESS_TOKEN}`},body:JSON.stringify({items:[{title:'Diagnóstico Motoras IA',quantity:1,unit_price:3000,currency_id:'ARS'}],back_urls:{success:`${base}/?pago=exito`,failure:`${base}/?pago=fallo`,pending:`${base}/?pago=pendiente`},auto_return:'approved'})});
    const d=await r.json(); if(!r.ok) return res.status(500).json({error:d.message});
    res.status(200).json({init_point:d.init_point});
  }catch(e){res.status(500).json({error:e.message});}
}
