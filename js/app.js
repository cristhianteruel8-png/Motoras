const DOLAR_BLUE = 1545;
const PRECIO_USD = 3;
document.getElementById('guardarUsuario')?.addEventListener('click',()=>{
  const data = {
    nombre: document.getElementById('nombre').value,
    telefono: document.getElementById('telefono').value,
    patente: document.getElementById('patente').value,
    ubicacion: document.getElementById('ubicacion').value
  };
  localStorage.setItem('motoras_user', JSON.stringify(data));
  document.getElementById('usuarioStatus').textContent='✅ Datos guardados';
});
document.getElementById('diagnosticarBtn')?.addEventListener('click', async ()=>{
  const falla = document.getElementById('fallaInput').value;
  const resultDiv = document.getElementById('diagnosticoResult');
  if(!falla){ resultDiv.textContent='Contá qué le pasa al auto'; return; }
  resultDiv.textContent='🧠 Analizando con IA...';
  try{
    const res = await fetch('/api/diagnostico',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({falla})});
    const data = await res.json();
    resultDiv.innerHTML = `<div style="background:#111;padding:16px;border-radius:12px;margin-top:12px;border-left:3px solid #ff1a1a">${data.diagnostico||JSON.stringify(data)}</div>`;
  }catch(e){ resultDiv.textContent='Error: '+e.message; }
});
function solicitarServicio(tipo){ alert('Solicitando '+tipo); }
document.getElementById('mercadopagoBtn')?.addEventListener('click', async ()=>{
  const res = await fetch('/api/mercadopago/crear-preferencia',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({monto: 4635})});
  const data = await res.json();
  if(data.init_point) window.location.href=data.init_point;
});
if(window.paypal){
  paypal.Buttons({
    createOrder: async ()=>{
      const res = await fetch('/api/paypal/crear-orden',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({monto: 3})});
      const data = await res.json();
      return data.id;
    },
    onApprove: async (data)=>{
      await fetch('/api/paypal/capturar-orden',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderID: data.orderID})});
      document.getElementById('pagoStatus').textContent='✅ Pago aprobado';
    }
  }).render('#paypal-button-container');
}
