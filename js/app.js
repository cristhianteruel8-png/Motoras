import { CONFIG } from "./config.js";
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

window.mostrar = function(id) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('activo'));
  document.getElementById(id).classList.add('activo');
  setTimeout(() => {
    if (window.mapaPedido) window.mapaPedido.invalidateSize();
    if (window.mapas) Object.values(window.mapas).forEach(m=>m.map.invalidateSize());
  }, 200);
};

function validarEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}
function mostrarResultado(el,txt,err=false){el.style.display='block';el.textContent=txt;el.classList.toggle('error',err);}

window.cambiarTab = function(sec,tab,btn){
  document.getElementById(sec+'-login').classList.toggle('activo-tab-panel',tab==='login');
  document.getElementById(sec+'-registro').classList.toggle('activo-tab-panel',tab==='registro');
  document.querySelectorAll('#'+sec+'.tab-btn').forEach(b=>b.classList.remove('activo-tab'));
  btn.classList.add('activo-tab');
};

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if(!user) return;
  const { data: pu } = await supabaseClient.from('perfiles_usuario').select('id').eq('id',user.id).maybeSingle();
  const { data: pp } = await supabaseClient.from('perfiles_prestador').select('id').eq('id',user.id).maybeSingle();
  if(pu){document.getElementById('usuarioAuthBox').style.display='none';document.getElementById('usuarioPanel').style.display='block';}
  if(pp){document.getElementById('prestadorAuthBox').style.display='none';document.getElementById('prestadorPanel').style.display='block';cargarPedidosReal();}
});

window.registrarUsuarioReal = async function(){
  const nombre=document.getElementById('nombre').value.trim();
  const email=document.getElementById('email').value.trim();
  const pass=document.getElementById('passUsuario').value;
  const auto=document.getElementById('auto').value.trim();
  const anio=document.getElementById('anio').value.trim();
  const motor=document.getElementById('motor').value.trim();
  const div=document.getElementById('usuarioResultado');
  if(!nombre||!validarEmail(email)||pass.length<6){mostrarResultado(div,'Completá nombre, email válido y pass +6',true);return;}
  div.textContent='Creando...';div.style.display='block';
  const {data,error}=await supabaseClient.auth.signUp({email,password:pass});
  let userId=data?.user?.id;
  if(error&&error.message.toLowerCase().includes('already')){
    const {data:dl,error:el}=await supabaseClient.auth.signInWithPassword({email,password:pass});
    if(el){mostrarResultado(div,'Email ya existe, usá su contraseña',true);return;}
    userId=dl.user.id;
  } else if(error){mostrarResultado(div,error.message,true);return;}
  if(!userId){mostrarResultado(div,'Confirmá tu email');return;}
  const {error:ep}=await supabaseClient.from('perfiles_usuario').upsert([{id:userId,nombre,auto,anio,motor}]);
  mostrarResultado(div,ep?'Error perfil: '+ep.message:'¡Cuenta creada! Iniciá sesión',!!ep);
};

window.iniciarSesionUsuarioReal = async function(){
  const email=document.getElementById('loginEmailUsuario').value.trim();
  const pass=document.getElementById('loginPassUsuario').value;
  const div=document.getElementById('usuarioResultado');div.style.display='block';div.textContent='Entrando...';
  const {error}=await supabaseClient.auth.signInWithPassword({email,password:pass});
  if(error){mostrarResultado(div,error.message,true);return;}
  document.getElementById('usuarioAuthBox').style.display='none';document.getElementById('usuarioPanel').style.display='block';
};

window.cerrarSesionUsuario = async function(){await supabaseClient.auth.signOut();location.reload();};

window.registrarPrestadorReal = async function(){
  const nombre=document.getElementById('nombrePrestador').value.trim();
  const email=document.getElementById('emailPrestador').value.trim();
  const pass=document.getElementById('passPrestador').value;
  const tipo=document.getElementById('tipoPrestador').value;
  const zona=document.getElementById('zonaPrestador').value.trim();
  const div=document.getElementById('prestadorResultado');div.style.display='block';
  if(!nombre||!validarEmail(email)||pass.length<6){mostrarResultado(div,'Datos inválidos',true);return;}
  div.textContent='Registrando...';
  const {data,error}=await supabaseClient.auth.signUp({email,password:pass});
  let userId=data?.user?.id;
  if(error&&error.message.toLowerCase().includes('already')){
    const {data:dl,error:el}=await supabaseClient.auth.signInWithPassword({email,password:pass});
    if(el){mostrarResultado(div,'Email ya existe',true);return;}userId=dl.user.id;
  } else if(error){mostrarResultado(div,error.message,true);return;}
  if(!userId){mostrarResultado(div,'Confirmá tu email');return;}
  const {error:ep}=await supabaseClient.from('perfiles_prestador').upsert([{id:userId,nombre,tipo,zona}]);
  mostrarResultado(div,ep?'Error: '+ep.message:'¡Prestador registrado!',!!ep);
};

window.iniciarSesionPrestadorReal = async function(){
  const email=document.getElementById('loginEmailPrestador').value.trim();
  const pass=document.getElementById('loginPassPrestador').value;
  const div=document.getElementById('prestadorResultado');div.textContent='Entrando...';div.style.display='block';
  const {error}=await supabaseClient.auth.signInWithPassword({email,password:pass});
  if(error){mostrarResultado(div,error.message,true);return;}
  document.getElementById('prestadorAuthBox').style.display='none';document.getElementById('prestadorPanel').style.display='block';cargarPedidosReal();
};

window.cerrarSesionPrestador = async function(){await supabaseClient.auth.signOut();location.reload();};

window.guardarDiagnosticoReal = async function(){
  const problema=document.getElementById('problema').value.trim();
  const codigo=document.getElementById('codigo').value.trim();
  const div=document.getElementById('respuestaIA');
  if(!problema){div.textContent='Describí la falla';div.classList.add('error');return;}
  const {data:{user}}=await supabaseClient.auth.getUser();
  if(!user){div.textContent='Iniciá sesión';div.classList.add('error');return;}
  div.textContent='Guardando...';div.classList.remove('error');
  const {error}=await supabaseClient.from('diagnosticos').insert([{usuario_id:user.id,problema,codigo}]);
  div.textContent=error?'Error: '+error.message:'Diagnóstico guardado, IA lo analizará pronto.';
};

let mapaPedido=null, marcadorPedido=null, pedidoLat=null, pedidoLon=null;
window.mapas={};
window.iniciarMapaPedido=function(){
  if(mapaPedido){setTimeout(()=>mapaPedido.invalidateSize(),100);return;}
  mapaPedido=L.map('mapaServicios').setView([-31.4,-64.2],5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(mapaPedido);
  mapaPedido.on('click',e=>colocarPedidoEnMapa(e.latlng.lat,e.latlng.lng));
  setTimeout(()=>mapaPedido.invalidateSize(),200);
};
window.usarMiUbicacionPedido=function(){
  document.getElementById('ubicacionServiciosTexto').textContent='Buscando...';iniciarMapaPedido();
  navigator.geolocation.getCurrentPosition(p=>colocarPedidoEnMapa(p.coords.latitude,p.coords.longitude),e=>{document.getElementById('ubicacionServiciosTexto').textContent='Error: '+e.message});
};
window.colocarPedidoEnMapa=async function(lat,lon){
  iniciarMapaPedido();pedidoLat=lat;pedidoLon=lon;
  if(marcadorPedido) mapaPedido.removeLayer(marcadorPedido);
  marcadorPedido=L.marker([lat,lon]).addTo(mapaPedido).bindPopup('Tu vehículo').openPopup();
  mapaPedido.setView([lat,lon],14);
  document.getElementById('ubicacion').value=`${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  document.getElementById('ubicacionServiciosTexto').textContent=`📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const d=await r.json(); if(d.display_name){document.getElementById('ubicacion').value=d.display_name;document.getElementById('ubicacionServiciosTexto').textContent='📍 '+d.display_name;}
  }catch{}
};
window.guardarPedidoReal=async function(){
  const tipo=document.getElementById('tipoServicio').value;
  const ubi=document.getElementById('ubicacion').value.trim();
  const div=document.getElementById('servicioResultado');div.style.display='block';
  if(!ubi||pedidoLat===null){mostrarResultado(div,'Elegí ubicación en el mapa',true);return;}
  const {data:{user}}=await supabaseClient.auth.getUser();if(!user){mostrarResultado(div,'Iniciá sesión',true);return;}
  div.textContent='Enviando...';
  const {error}=await supabaseClient.from('pedidos').insert([{usuario_id:user.id,tipo_servicio:tipo,ubicacion:ubi,lat:pedidoLat,lon:pedidoLon,estado:'Esperando aceptación'}]);
  mostrarResultado(div,error?'Error: '+error.message:'¡Pedido enviado!',!!error);
};
window.cargarPedidosReal=async function(){
  const div=document.getElementById('listaPedidos');div.innerHTML='Cargando...';
  const {data,error}=await supabaseClient.from('pedidos').select('*').eq('estado','Esperando aceptación').order('creado_en',{ascending:false});
  if(error){div.innerHTML=`<div class="resultado error">${error.message}</div>`;return;}
  if(!data.length){div.innerHTML='No hay pedidos';return;}
  div.innerHTML=data.map(p=>`<div class="resultado"><b>${p.tipo_servicio}</b><br>${p.ubicacion}<br><button class="btn" onclick="aceptarPedidoReal('${p.id}')">Aceptar</button></div>`).join('');
};
window.aceptarPedidoReal=async function(id){
  const {data:{user}}=await supabaseClient.auth.getUser();
  const {error}=await supabaseClient.from('pedidos').update({estado:'Aceptado',prestador_id:user.id}).eq('id',id);
  if(error) alert(error.message); else cargarPedidosReal();
};
window.pagarConMercadoPago=async function(){
  const div=document.getElementById('pagoResultado');div.style.display='block';div.textContent='Generando...';
  const r=await fetch('/api/crear-pago',{method:'POST'});const d=await r.json();
  if(!r.ok){div.textContent=d.error;return;}location.href=d.init_point;
};
window.guardarCalificacionReal=async function(){
  const estrellas=(document.getElementById('estrellas').value.match(/⭐/g)||[]).length;
  const div=document.getElementById('calificacionResultado');div.style.display='block';
  const {data:{user}}=await supabaseClient.auth.getUser();if(!user){div.textContent='Iniciá sesión';return;}
  const {error}=await supabaseClient.from('calificaciones').insert([{usuario_id:user.id,estrellas}]);
  div.textContent=error?error.message:'¡Gracias!';
};
window.obtenerUbicacion=function(cid,tid){
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat=pos.coords.latitude,lon=pos.coords.longitude;
    document.getElementById(tid).textContent=`${lat}, ${lon}`;
    if(!window.mapas[cid]){const m=L.map(cid).setView([lat,lon],14);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(m);window.mapas[cid]={map:m};}
    setTimeout(()=>window.mapas[cid].map.invalidateSize(),100);
  });
};
// PayPal
window.addEventListener('DOMContentLoaded',()=>{
  const check=setInterval(()=>{
    if(window.paypal&&document.getElementById('paypal-button-container').innerHTML===''){
      clearInterval(check);
      paypal.Buttons({
        createOrder:()=>fetch('/api/crear-orden-paypal',{method:'POST'}).then(r=>r.json()).then(d=>{if(!d.id) throw new Error(d.error);return d.id;}),
        onApprove:data=>fetch('/api/capturar-orden-paypal?orderID='+data.orderID,{method:'POST'}).then(r=>r.json()).then(()=>{document.getElementById('pagoResultado').style.display='block';document.getElementById('pagoResultado').textContent='✅ ¡Pago aprobado!';}),
        onError:err=>{const d=document.getElementById('pagoResultado');d.style.display='block';d.textContent='Error PayPal: '+err;}
      }).render('#paypal-button-container');
    }
  },500);
});
