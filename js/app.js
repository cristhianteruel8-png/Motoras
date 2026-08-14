import { CONFIG } from "./config.js";
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

function tienePago() { return localStorage.getItem('motoras_pagado') === 'ok'; }
window.desbloquearIA = function() {
  const b = document.getElementById('bloqueoIA');
  const f = document.getElementById('formIA');
  if (!b ||!f) return;
  if (tienePago()) { b.style.display='none'; f.style.display='block'; }
  else { b.style.display='block'; f.style.display='none'; }
};
(function() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('pago') === 'exito') localStorage.setItem('motoras_pagado','ok');
})();

window.mostrar = function(id) {
  document.querySelectorAll('section').forEach(s=>s.classList.remove('activo'));
  const t = document.getElementById(id); if(t) t.classList.add('activo');
  if(id==='diagnostico') desbloquearIA();
  if(id==='pago') actualizarPrecioDolar();
  setTimeout(()=>{
    if(mapas['mapaServicios']) mapas['mapaServicios'].map.invalidateSize();
    if(mapaPedido) mapaPedido.invalidateSize();
  },200);
};

(function mostrarResultadoPago() {
  const params = new URLSearchParams(window.location.search);
  const pago = params.get('pago');
  if(!pago) return;
  const msgs = { exito:'✅ ¡Pago aprobado! IA desbloqueada.', fallo:'❌ Pago fallido.', pendiente:'⏳ Pago pendiente.' };
  window.addEventListener('DOMContentLoaded',()=>{
    mostrar('pago');
    const div=document.getElementById('pagoResultado');
    if(div){ div.style.display='block'; div.textContent=msgs[pago]||''; }
    if(pago==='exito') localStorage.setItem('motoras_pagado','ok');
  });
})();

window.addEventListener('DOMContentLoaded', async()=>{
  desbloquearIA(); actualizarPrecioDolar();
  const { data:{user} } = await supabaseClient.auth.getUser();
  if(!user) return;
  const { data:u } = await supabaseClient.from('perfiles_usuario').select('id').eq('id',user.id).maybeSingle();
  const { data:pr } = await supabaseClient.from('perfiles_prestador').select('id').eq('id',user.id).maybeSingle();
  if(u){ document.getElementById('usuarioAuthBox').style.display='none'; document.getElementById('usuarioPanel').style.display='block'; }
  if(pr){ document.getElementById('prestadorAuthBox').style.display='none'; document.getElementById('prestadorPanel').style.display='block'; cargarPedidosReal(); }
});

function validarEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function mostrarResultado(el,txt,err=false){ el.style.display='block'; el.textContent=txt; el.classList.toggle('error',err); }
window.cambiarTab = function(sec,tab,btn){
  document.getElementById(sec+'-login').classList.toggle('activo-tab-panel',tab==='login');
  document.getElementById(sec+'-registro').classList.toggle('activo-tab-panel',tab==='registro');
  document.querySelectorAll('#'+sec+'.tab-btn').forEach(b=>b.classList.remove('activo-tab'));
  btn.classList.add('activo-tab');
};
window.registrarUsuarioReal = async function(){
  const nombre=document.getElementById('nombre').value.trim();
  const email=document.getElementById('email').value.trim();
  const pass=document.getElementById('passUsuario').value;
  const auto=document.getElementById('auto').value.trim();
  const anio=document.getElementById('anio').value.trim();
  const motor=document.getElementById('motor').value.trim();
  const div=document.getElementById('usuarioResultado'); div.style.display='block';
  if(!nombre||!email||!pass){ mostrarResultado(div,'Completá nombre, email y contraseña.',true); return; }
  div.textContent='Creando...'; let uid=null;
  const {data,error}=await supabaseClient.auth.signUp({email,password:pass});
  if(error){
    if(error.message.toLowerCase().includes('already')){
      const {data:dl,error:el}=await supabaseClient.auth.signInWithPassword({email,password:pass});
      if(el){ mostrarResultado(div,'Email ya existe.',true); return; } uid=dl.user.id;
    } else { mostrarResultado(div,'Error: '+error.message,true); return; }
  } else { uid=data.user?.id; if(!uid){ mostrarResultado(div,'Te enviamos email.'); return; } }
  const {error:ep}=await supabaseClient.from('perfiles_usuario').upsert([{id:uid,nombre,auto,anio,motor}]);
  mostrarResultado(div,ep?'Error: '+ep.message:'¡Cuenta creada!',!!ep);
};
window.iniciarSesionUsuarioReal = async function(){
  const email=document.getElementById('loginEmailUsuario').value.trim();
  const pass=document.getElementById('loginPassUsuario').value;
  const div=document.getElementById('usuarioResultado'); div.style.display='block'; div.textContent='Entrando...';
  const {error}=await supabaseClient.auth.signInWithPassword({email,password:pass});
  if(error){ mostrarResultado(div,'Error: '+error.message,true); return; }
  document.getElementById('usuarioAuthBox').style.display='none'; document.getElementById('usuarioPanel').style.display='block'; mostrarResultado(div,'¡Bienvenido!');
};
window.cerrarSesionUsuario = async function(){ await supabaseClient.auth.signOut(); document.getElementById('usuarioPanel').style.display='none'; document.getElementById('usuarioAuthBox').style.display='block'; };
window.registrarPrestadorReal = async function(){
  const nombre=document.getElementById('nombrePrestador').value.trim();
  const email=document.getElementById('emailPrestador').value.trim();
  const pass=document.getElementById('passPrestador').value;
  const tipo=document.getElementById('tipoPrestador').value;
  const zona=document.getElementById('zonaPrestador').value.trim();
  const div=document.getElementById('prestadorResultado'); div.style.display='block';
  if(!nombre||!email||!pass){ mostrarResultado(div,'Completá campos.',true); return; }
  div.textContent='Registrando...'; let uid=null;
  const {data,error}=await supabaseClient.auth.signUp({email,password:pass});
  if(error){
    if(error.message.toLowerCase().includes('already')){
      const {data:dl,error:el}=await supabaseClient.auth.signInWithPassword({email,password:pass});
      if(el){ mostrarResultado(div,'Email ya existe.',true); return; } uid=dl.user.id;
    } else { mostrarResultado(div,'Error: '+error.message,true); return; }
  } else { uid=data.user?.id; if(!uid){ mostrarResultado(div,'Confirmá email.'); return; } }
  const {error:ep}=await supabaseClient.from('perfiles_prestador').upsert([{id:uid,nombre,tipo,zona}]);
  mostrarResultado(div,ep?'Error: '+ep.message:'¡Prestador guardado!',!!ep);
};
window.iniciarSesionPrestadorReal = async function(){
  const email=document.getElementById('loginEmailPrestador').value.trim();
  const pass=document.getElementById('loginPassPrestador').value;
  const div=document.getElementById('prestadorResultado'); div.style.display='block'; div.textContent='Entrando...';
  const {error}=await supabaseClient.auth.signInWithPassword({email,password:pass});
  if(error){ mostrarResultado(div,'Error: '+error.message,true); return; }
  document.getElementById('prestadorAuthBox').style.display='none'; document.getElementById('prestadorPanel').style.display='block'; cargarPedidosReal();
};
window.cerrarSesionPrestador = async function(){ await supabaseClient.auth.signOut(); document.getElementById('prestadorPanel').style.display='none'; document.getElementById('prestadorAuthBox').style.display='block'; };
window.guardarDiagnosticoReal = async function(){
  const problema=document.getElementById('problema').value.trim();
  const codigo=document.getElementById('codigo').value.trim();
  const div=document.getElementById('respuestaIA');
  if(!tienePago()){ div.textContent='🔒 Tenés que pagar primero en PAGO.'; div.style.display='block'; div.classList.add('error'); setTimeout(()=>mostrar('pago'),1000); return; }
  if(!problema){ div.textContent='Describí la falla.'; div.style.display='block'; div.classList.add('error'); return; }
  const {data:{user}}=await supabaseClient.auth.getUser();
  if(!user){ div.textContent='Iniciá sesión primero.'; div.style.display='block'; return; }
  div.textContent='Guardando...'; div.style.display='block'; div.classList.remove('error');
  const {error}=await supabaseClient.from('diagnosticos').insert([{usuario_id:user.id,problema,codigo}]);
  div.textContent=error?'Error: '+error.message:'Diagnóstico guardado.';
  if(error) div.classList.add('error');
};
let mapaPedido=null; let marcadorPedido=null; let pedidoLat=null; let pedidoLon=null;
export const mapas={};
window.iniciarMapaPedido=function(){
  if(mapaPedido){ setTimeout(()=>mapaPedido.invalidateSize(),100); return; }
  mapaPedido=L.map('mapaServicios').setView([-31.4,-64.2],5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(mapaPedido);
  mapaPedido.on('click',e=>colocarPedidoEnMapa(e.latlng.lat,e.latlng.lng));
  setTimeout(()=>mapaPedido.invalidateSize(),200);
};
window.usarMiUbicacionPedido=function(){
  document.getElementById('ubicacionServiciosTexto').textContent='Buscando...';
  iniciarMapaPedido();
  navigator.geolocation.getCurrentPosition(p=>colocarPedidoEnMapa(p.coords.latitude,p.coords.longitude));
};
window.colocarPedidoEnMapa=async function(lat,lon){
  iniciarMapaPedido(); pedidoLat=lat; pedidoLon=lon;
  if(marcadorPedido) mapaPedido.removeLayer(marcadorPedido);
  marcadorPedido=L.marker([lat][lon]).addTo(mapaPedido).bindPopup('📍 Tu vehículo').openPopup();
  mapaPedido.setView([lat][lon],14);
  document.getElementById('ubicacionServiciosTexto').textContent=`📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const d=await r.json();
    document.getElementById('ubicacion').value=d.display_name||`${lat}, ${lon}`;
  }catch{ document.getElementById('ubicacion').value=`${lat}, ${lon}`; }
};
window.guardarPedidoReal=async function(){
  const tipo=document.getElementById('tipoServicio').value;
  const ubi=document.getElementById('ubicacion').value.trim();
  const div=document.getElementById('servicioResultado'); div.style.display='block';
  if(!ubi||pedidoLat===null){ div.textContent='Elegí ubicación.'; div.classList.add('error'); return; }
  const {data:{user}}=await supabaseClient.auth.getUser();
  if(!user){ div.textContent='Iniciá sesión.'; return; }
  div.textContent='Enviando...';
  const {error}=await supabaseClient.from('pedidos').insert([{usuario_id:user.id,tipo_servicio:tipo,ubicacion:ubi,lat:pedidoLat,lon:pedidoLon,estado:'Esperando aceptación'}]);
  div.textContent=error?'Error: '+error.message:'¡Pedido enviado!';
};
window.cargarPedidosReal=async function(){
  const div=document.getElementById('listaPedidos'); div.innerHTML='Cargando...';
  const {data,error}=await supabaseClient.from('pedidos').select('*').eq('estado','Esperando aceptación').order('creado_en',{ascending:false});
  if(error){ div.innerHTML='Error: '+error.message; return; }
  if(!data.length){ div.innerHTML='No hay pedidos.'; return; }
  div.innerHTML=data.map(p=>`<div class="resultado"><b>${p.tipo_servicio}</b><br>${p.ubicacion}<br><button class="btn" onclick="aceptarPedidoReal('${p.id}')">Aceptar</button></div>`).join('');
};
window.aceptarPedidoReal=async function(id){
  const {data:{user}}=await supabaseClient.auth.getUser();
  await supabaseClient.from('pedidos').update({estado:'Aceptado',prestador_id:user.id}).eq('id',id);
  cargarPedidosReal();
};
window.pagarConMercadoPago=async function(){
  const div=document.getElementById('pagoResultado'); div.style.display='block'; div.textContent='Generando pago...';
  try{
    const r=await fetch('/api/crear-pago',{method:'POST'});
    const d=await r.json();
    if(!r.ok||!d.init_point){ div.textContent='Error: '+(d.error||'reintentá'); return; }
    window.location.href=d.init_point;
  }catch(e){ div.textContent='Error: '+e.message; }
};
window.addEventListener('DOMContentLoaded',()=>{
  const check=setInterval(()=>{
    if(!window.paypal||!document.getElementById('paypal-button-container')) return;
    clearInterval(check);
    paypal.Buttons({
      createOrder:()=>fetch('/api/crear-orden-paypal',{method:'POST'}).then(r=>r.json()).then(d=>{ if(!d.id) throw new Error(d.error); return d.id; }),
      onApprove:data=>fetch('/api/capturar-orden-paypal?orderID='+data.orderID,{method:'POST'}).then(r=>r.json()).then(d=>{
        const div=document.getElementById('pagoResultado'); div.style.display='block';
        if(d.status==='COMPLETED'||d.status==='APPROVED'){ localStorage.setItem('motoras_pagado','ok'); div.textContent='✅ ¡PayPal aprobado! IA desbloqueada.'; desbloquearIA(); }
        else div.textContent='Estado: '+d.status;
      }),
      onError:err=>{
        const div=document.getElementById('pagoResultado'); div.style.display='block'; div.textContent='Error PayPal: '+err; div.classList.add('error');
      }
    }).render('#paypal-button-container');
  },500);
});
window.guardarCalificacionReal=async function(){
  const v=document.getElementById('estrellas').value;
  const est=(v.match(/⭐/g)||[]).length;
  const div=document.getElementById('calificacionResultado'); div.style.display='block';
  const {data:{user}}=await supabaseClient.auth.getUser();
  if(!user){ div.textContent='Iniciá sesión.'; return; }
  const {error}=await supabaseClient.from('calificaciones').insert([{usuario_id:user.id,estrellas:est}]);
  div.textContent=error?'Error: '+error.message:'¡Gracias!';
};
// PRECIO DOLAR FIX
window.actualizarPrecioDolar=async function(){
  const elDolar=document.getElementById('dolarValor');
  const elARS=document.getElementById('precioARS');
  const elUSD=document.getElementById('precioUSD');
  if(elUSD) elUSD.textContent='3 USD';
  let venta=null;
  try{ const r=await fetch('https://dolarapi.com/v1/dolares/blue',{cache:'no-store'}); if(r.ok){ const d=await r.json(); venta=d.venta; } }catch(e){}
  if(!venta){ try{ const r2=await fetch('/api/dolar',{cache:'no-store'}); if(r2.ok){ const d2=await r2.json(); venta=d2.venta; } }catch(e){} }
  if(!venta){ try{ const r3=await fetch('https://api.bluelytics.com.ar/v2/latest',{cache:'no-store'}); if(r3.ok){ const d3=await r3.json(); venta=d3.blue.value_sell; } }catch(e){} }
  if(!venta) venta=1450;
  const ars=Math.round(venta*3);
  if(elDolar) elDolar.textContent=`$${venta.toLocaleString('es-AR')} ARS`;
  if(elARS) elARS.textContent=`$${ars.toLocaleString('es-AR')} ARS`;
};
window.obtenerUbicacion=function(cid,tid){
  navigator.geolocation.getCurrentPosition(p=>{
    const lat=p.coords.latitude, lon=p.coords.longitude;
    document.getElementById(tid).textContent=`📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    if(!mapas[cid]){
      const m=L.map(cid).setView([lat][lon],14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m);
      mapas[cid]={map:m,marker:null};
    } else mapas[cid].map.setView([lat][lon],14);
    setTimeout(()=>mapas[cid].map.invalidateSize(),100);
    if(mapas[cid].marker) mapas[cid].map.removeLayer(mapas[cid].marker);
    mapas[cid].marker=L.marker([lat][lon]).addTo(mapas[cid].map).bindPopup('📍 Pedido').openPopup();
  });
};
