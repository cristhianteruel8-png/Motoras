export const config = { runtime: 'nodejs' };
function getBase(){return process.env.PAYPAL_ENV==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';}
async function getToken(){
  const auth=Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const r=await fetch(`${getBase()}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});
  const d=await r.json(); return d.access_token;
}
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'No permitido'});
  try{
    const {orderID}=req.query; if(!orderID) return res.status(400).json({error:'Falta orderID'});
    const token=await getToken();
    const cap=await fetch(`${getBase()}/v2/checkout/orders/${orderID}/capture`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}});
    const data=await cap.json(); if(!cap.ok) return res.status(500).json({error:data.message||JSON.stringify(data)});
    res.status(200).json({status:data.status,data});
  }catch(e){res.status(500).json({error:e.message});}
}
