export const config = { runtime: 'nodejs' };
function getBase(){return process.env.PAYPAL_ENV==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';}
async function getToken(){
  const auth=Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const r=await fetch(`${getBase()}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});
  const d=await r.json(); if(!d.access_token) throw new Error(JSON.stringify(d)); return d.access_token;
}
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Método no permitido'});
  try{
    const token=await getToken();
    const order=await fetch(`${getBase()}/v2/checkout/orders`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({intent:'CAPTURE',purchase_units:[{amount:{currency_code:'USD',value:'3.00'},description:'Diagnóstico Motoras IA'}]})});
    const data=await order.json(); if(!order.ok) return res.status(500).json({error:JSON.stringify(data)});
    res.status(200).json({id:data.id});
  }catch(e){res.status(500).json({error:e.message});}
}
