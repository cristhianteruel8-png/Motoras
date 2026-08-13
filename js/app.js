import { CONFIG } from "./config.js";

const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ---------- SISTEMA DE PAGO PARA DESBLOQUEAR IA ----------
function tienePago() {
  return localStorage.getItem('motoras_pagado') === 'ok';
}
window.desbloquearIA = function() {
  const bloqueo = document.getElementById('bloqueoIA');
  const form = document.getElementById('formIA');
  if (!bloqueo ||!form) return;
  if (tienePago()) {
    bloqueo.style.display = 'none';
    form.style.display = 'block';
  } else {
    bloqueo.style.display = 'block';
    form.style.display = 'none';
  }
};

// Si viene de Mercado Pago con?pago=exito lo guardamos
(function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('pago') === 'exito') {
    localStorage.setItem('motoras_pagado', 'ok');
  }
})();

// ---------- NAVEGACIÓN ----------
window.mostrar = function(idSeccion) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('activo'));
  const target = document.getElementById(idSeccion);
  if (target) target.classList.add('activo');
  if (idSeccion === 'diagnostico') desbloquearIA();
  setTimeout(() => {
    if (mapas['mapaServicios']) mapas['mapaServicios'].map.invalidateSize();
    if (mapas['mapaPrestador']) mapas['mapaPrestador'].map.invalidateSize();
    if (mapaPedido) mapaPedido.invalidateSize();
  }, 200);
};

// ---------- MENSAJES DE PAGO POR URL ----------
(function mostrarResultadoPago() {
  const params = new URLSearchParams(window.location.search);
  const pago = params.get('pago');
  if (!pago) return;
  const mensajes = {
    exito: '✅ ¡Pago aprobado! Ya tenés acceso a la IA Mecánica.',
    fallo: '❌ El pago no se pudo procesar. Probá de nuevo.',
    pendiente: '⏳ Tu pago está pendiente de confirmación.'
  };
  window.addEventListener('DOMContentLoaded', () => {
    mostrar('pago');
    const div = document.getElementById('pagoResultado');
    if (div) {
      div.style.display = 'block';
      div.textContent = mensajes[pago] || '';
    }
    if (pago === 'exito') {
      localStorage.setItem('motoras_pagado', 'ok');
    }
  });
})();

// ---------- SESIÓN ----------
window.addEventListener('DOMContentLoaded', async () => {
  desbloquearIA();
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;
  const { data: perfilUsuario } = await supabaseClient.from('perfiles_usuario').select('id').eq('id', user.id).maybeSingle();
  const { data: perfilPrestador } = await supabaseClient.from('perfiles_prestador').select('id').eq('id', user.id).maybeSingle();
  if (perfilUsuario) {
    document.getElementById('usuarioAuthBox').style.display = 'none';
    document.getElementById('usuarioPanel').style.display = 'block';
  }
  if (perfilPrestador) {
    document.getElementById('prestadorAuthBox').style.display = 'none';
    document.getElementById('prestadorPanel').style.display = 'block';
    cargarPedidosReal();
  }
});

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function mostrarResultado(elemento, texto, esError=false) {
  elemento.style.display = 'block';
  elemento.textContent = texto;
  elemento.classList.toggle('error', esError);
}

// ---------- TABS ----------
window.cambiarTab = function(seccion, tab, boton) {
  document.getElementById(seccion + '-login').classList.toggle('activo-tab-panel', tab === 'login');
  document.getElementById(seccion + '-registro').classList.toggle('activo-tab-panel', tab === 'registro');
  document.querySelectorAll('#' + seccion + '.tab-btn').forEach(b => b.classList.remove('activo-tab'));
  boton.classList.add('activo-tab');
};

// ---------- USUARIO ----------
window.registrarUsuarioReal = async function() {
  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('passUsuario').value;
  const auto = document.getElementById('auto').value.trim();
  const anio = document.getElementById('anio').value.trim();
  const motor = document.getElementById('motor').value.trim();
  const div = document.getElementById('usuarioResultado');
  div.style.display = 'block';
  if (!nombre ||!email ||!password) { mostrarResultado(div, 'Completá nombre, email y contraseña.', true); return; }
  if (!validarEmail(email)) { mostrarResultado(div, 'Email inválido.', true); return; }
  if (password.length < 6) { mostrarResultado(div, 'La contraseña debe tener al menos 6 caracteres.', true); return; }
  div.textContent = 'Creando cuenta...';
  let userId = null;
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      const { data: dataLogin, error: errorLogin } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (errorLogin) { mostrarResultado(div, 'Ese email ya existe. Ingresá la contraseña correcta.', true); return; }
      userId = dataLogin.user.id;
    } else { mostrarResultado(div, 'Error: ' + error.message, true); return; }
  } else {
    userId = data.user?.id;
    if (!userId) { mostrarResultado(div, 'Te enviamos un email de confirmación. Confirmá y luego iniciá sesión.'); return; }
  }
  const { error: errorPerfil } = await supabaseClient.from('perfiles_usuario').upsert([{ id: userId, nombre, auto, anio, motor }]);
  mostrarResultado(div, errorPerfil? 'Cuenta creada pero error perfil: ' + errorPerfil.message : '¡Cuenta creada! Ya podés iniciar sesión.',!!errorPerfil);
};

window.iniciarSesionUsuarioReal = async function() {
  const email = document.getElementById('loginEmailUsuario').value.trim();
  const password = document.getElementById('loginPassUsuario').value;
  const div = document.getElementById('usuarioResultado');
  div.style.display = 'block';
  if (!validarEmail(email)) { mostrarResultado(div, 'Email inválido.', true); return; }
  div.textContent = 'Iniciando sesión...';
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { mostrarResultado(div, 'Error: ' + error.message, true); return; }
  document.getElementById('usuarioAuthBox').style.display = 'none';
  document.getElementById('usuarioPanel').style.display = 'block';
  mostrarResultado(div, '¡Bienvenido!', false);
};

window.cerrarSesionUsuario = async function() {
  await supabaseClient.auth.signOut();
  document.getElementById('usuarioPanel').style.display = 'none';
  document.getElementById('usuarioAuthBox').style.display = 'block';
  document.getElementById('usuarioResultado').style.display = 'none';
};

// ---------- PRESTADOR ----------
window.registrarPrestadorReal = async function() {
  const nombre = document.getElementById('nombrePrestador').value.trim();
  const email = document.getElementById('emailPrestador').value.trim();
  const password = document.getElementById('passPrestador').value;
  const tipo = document.getElementById('tipoPrestador').value;
  const zona = document.getElementById('zonaPrestador').value.trim();
  const div = document.getElementById('prestadorResultado');
  div.style.display = 'block';
  if (!nombre ||!email ||!password) { mostrarResultado(div, 'Completá todos los campos.', true); return; }
  if (!validarEmail(email)) { mostrarResultado(div, 'Email inválido.', true); return; }
  div.textContent = 'Registrando...';
  let userId = null;
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      const { data: dataLogin, error: errorLogin } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (errorLogin) { mostrarResultado(div, 'Email ya existe, usá su contraseña.', true); return; }
      userId = dataLogin.user.id;
    } else { mostrarResultado(div, 'Error: ' + error.message, true); return; }
  } else {
    userId = data.user?.id;
    if (!userId) { mostrarResultado(div, 'Confirmá tu email y luego iniciá sesión.'); return; }
  }
  const { error: errorPerfil } = await supabaseClient.from('perfiles_prestador').upsert([{ id: userId, nombre, tipo, zona }]);
  mostrarResultado(div, errorPerfil? 'Error perfil: ' + errorPerfil.message : '¡Perfil de prestador guardado!',!!errorPerfil);
};

window.iniciarSesionPrestadorReal = async function() {
  const email = document.getElementById('loginEmailPrestador').value.trim();
  const password = document.getElementById('loginPassPrestador').value;
  const div = document.getElementById('prestadorResultado');
  div.style.display = 'block';
  div.textContent = 'Iniciando sesión...';
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { mostrarResultado(div, 'Error: ' + error.message, true); return; }
  document.getElementById('prestadorAuthBox').style.display = 'none';
  document.getElementById('prestadorPanel').style.display = 'block';
  cargarPedidosReal();
};

window.cerrarSesionPrestador = async function() {
  await supabaseClient.auth.signOut();
  document.getElementById('prestadorPanel').style.display = 'none';
  document.getElementById('prestadorAuthBox').style.display = 'block';
};

// ---------- DIAGNÓSTICO ----------
window.guardarDiagnosticoReal = async function() {
  const problema = document.getElementById('problema').value.trim();
  const codigo = document.getElementById('codigo').value.trim();
  const div = document.getElementById('respuestaIA');
  if (!tienePago()) {
    div.textContent = '🔒 Tenés que pagar primero en la sección PAGO.';
    div.classList.add('error');
    div.style.display = 'block';
    setTimeout(() => mostrar('pago'), 1200);
    return;
  }
  if (!problema) { div.textContent = 'Describí la falla antes.'; div.classList.add('error'); div.style.display='block'; return; }
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) { div.textContent = 'Iniciá sesión como usuario primero.'; div.classList.add('error'); div.style.display='block'; return; }
  div.classList.remove('error');
  div.style.display='block';
  div.textContent = 'Guardando diagnóstico...';
  const { error } = await supabaseClient.from('diagnosticos').insert([{ usuario_id: user.id, problema, codigo }]);
  div.textContent = error? 'Error: ' + error.message : 'Diagnóstico guardado. La IA lo analizará pronto.';
  if (error) div.classList.add('error');
};

// ---------- PEDIDOS / MAPA ----------
let mapaPedido = null;
let marcadorPedido = null;
let pedidoLat = null;
let pedidoLon = null;
export const mapas = {};

window.iniciarMapaPedido = function() {
  if (mapaPedido) { setTimeout(()=> mapaPedido.invalidateSize(), 100); return; }
  mapaPedido = L.map('mapaServicios').setView([-31.4, -64.2], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(mapaPedido);
  mapaPedido.on('click', e => colocarPedidoEnMapa(e.latlng.lat, e.latlng.lng));
  setTimeout(()=> mapaPedido.invalidateSize(), 200);
};

window.usarMiUbicacionPedido = function() {
  if (!navigator.geolocation) { alert('Tu navegador no soporta GPS.'); return; }
  document.getElementById('ubicacionServiciosTexto').textContent = 'Buscando tu ubicación...';
  iniciarMapaPedido();
  navigator.geolocation.getCurrentPosition(pos => {
    colocarPedidoEnMapa(pos.coords.latitude, pos.coords.longitude);
  }, err => {
    document.getElementById('ubicacionServiciosTexto').textContent = 'No se pudo obtener ubicación: ' + err.message + '. Tocá el mapa.';
  });
};

window.colocarPedidoEnMapa = async function(lat, lon) {
  iniciarMapaPedido();
  pedidoLat = lat; pedidoLon = lon;
  if (marcadorPedido) mapaPedido.removeLayer(marcadorPedido);
  marcadorPedido = L.marker([lat, lon]).addTo(mapaPedido).bindPopup('📍 Tu vehículo aquí').openPopup();
  mapaPedido.setView([lat, lon], 14);
  document.getElementById('ubicacionServiciosTexto').textContent = `📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await resp.json();
    const direccion = data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    document.getElementById('ubicacion').value = direccion;
    document.getElementById('ubicacionServiciosTexto').textContent = '📍 ' + direccion;
  } catch {
    document.getElementById('ubicacion').value = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
};

window.guardarPedidoReal = async function() {
  const tipoServicio = document.getElementById('tipoServicio').value;
  const ubicacion = document.getElementById('ubicacion').value.trim();
  const div = document.getElementById('servicioResultado');
  div.style.display = 'block';
  if (!ubicacion || pedidoLat === null) { div.textContent = 'Elegí ubicación con el botón o tocando el mapa.'; div.classList.add('error'); return; }
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) { div.textContent = 'Iniciá sesión primero.'; div.classList.add('error'); return; }
  div.classList.remove('error');
  div.textContent = 'Enviando pedido...';
  const { error } = await supabaseClient.from('pedidos').insert([{ usuario_id: user.id, tipo_servicio: tipoServicio, ubicacion, lat: pedidoLat, lon: pedidoLon, estado: 'Esperando aceptación' }]);
  div.textContent = error? 'Error: ' + error.message : '¡Pedido enviado! Un prestador lo verá pronto.';
  if (error) div.classList.add('error');
};

// ---------- PRESTADOR PEDIDOS ----------
window.cargarPedidosReal = async function() {
  const div = document.getElementById('listaPedidos');
  div.innerHTML = '<div class="resultado">Cargando pedidos...</div>';
  const { data, error } = await supabaseClient.from('pedidos').select('*').eq('estado', 'Esperando aceptación').order('creado_en', { ascending: false });
  if (error) { div.innerHTML = `<div class="resultado error">Error: ${error.message}</div>`; return; }
  if (!data || data.length === 0) { div.innerHTML = '<div class="resultado">No hay pedidos pendientes.</div>'; return; }
  div.innerHTML = data.map(p => `
    <div class="resultado">
      <strong>${p.tipo_servicio}</strong><br>
      Ubicación: ${p.ubicacion || 'No especificada'}<br>
      <button class="btn" onclick="aceptarPedidoReal('${p.id}')">Aceptar trabajo</button>
    </div>
  `).join('');
};

window.aceptarPedidoReal = async function(pedidoId) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;
  const { error } = await supabaseClient.from('pedidos').update({ estado: 'Aceptado', prestador_id: user.id }).eq('id', pedidoId);
  if (error) { alert('Error: ' + error.message); return; }
  cargarPedidosReal();
};

// ---------- PAGOS ----------
window.pagarConMercadoPago = async function() {
  const div = document.getElementById('pagoResultado');
  div.style.display = 'block';
  div.textContent = 'Generando pago...';
  try {
    const resp = await fetch('/api/crear-pago', { method: 'POST' });
    const data = await resp.json();
    if (!resp.ok ||!data.init_point) { div.textContent = 'Error: ' + (data.error || 'reintentá'); return; }
    window.location.href = data.init_point;
  } catch (e) {
    div.textContent = 'Error: ' + e.message;
  }
};

// PayPal Buttons
window.addEventListener('DOMContentLoaded', () => {
  const checkPayPal = setInterval(() => {
    if (!window.paypal ||!document.getElementById('paypal-button-container')) return;
    clearInterval(checkPayPal);
    paypal.Buttons({
      createOrder: () => fetch('/api/crear-orden-paypal', { method: 'POST' })
       .then(res => res.json())
       .then(data => {
          if (!data.id) throw new Error(data.error || 'No se pudo crear orden');
          return data.id;
        }),
      onApprove: data => fetch('/api/capturar-orden-paypal?orderID=' + data.orderID, { method: 'POST' })
       .then(res => res.json())
       .then(d => {
          const div = document.getElementById('pagoResultado');
          div.style.display = 'block';
          if (d.status === 'COMPLETED' || d.status === 'APPROVED') {
            localStorage.setItem('motoras_pagado', 'ok');
            div.textContent = '✅ ¡Pago con PayPal aprobado! IA desbloqueada.';
            desbloquearIA();
          } else {
            div.textContent = 'Pago capturado: ' + d.status;
          }
        }),
      onError: err => {
        const div = document.getElementById('pagoResultado');
        div.style.display = 'block';
        div.textContent = 'Error PayPal: ' + err;
        div.classList.add('error');
      }
    }).render('#paypal-button-container');
  }, 500);
});

// ---------- CALIFICACIÓN ----------
window.guardarCalificacionReal = async function() {
  const valorSelect = document.getElementById('estrellas').value;
  const estrellas = (valorSelect.match(/⭐/g) || []).length;
  const div = document.getElementById('calificacionResultado');
  div.style.display = 'block';
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) { div.textContent = 'Iniciá sesión primero.'; return; }
  div.textContent = 'Enviando...';
  const { error } = await supabaseClient.from('calificaciones').insert([{ usuario_id: user.id, estrellas }]);
  div.textContent = error? 'Error: ' + error.message : '¡Gracias por tu calificación!';
};

// ---------- MAPA PRESTADOR ----------
window.obtenerUbicacion = function(containerId, textId) {
  if (!navigator.geolocation) { alert('GPS no soportado'); return; }
  document.getElementById(textId).textContent = 'Buscando ubicación...';
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    document.getElementById(textId).textContent = `📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    if (!mapas[containerId]) {
      const mapa = L.map(containerId).setView([lat, lon], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(mapa);
      mapas[containerId] = { map: mapa, marker: null };
    } else {
      mapas[containerId].map.setView([lat, lon], 14);
    }
    setTimeout(() => mapas[containerId].map.invalidateSize(), 100);
    if (mapas[containerId].marker) mapas[containerId].map.removeLayer(mapas[containerId].marker);
    mapas[containerId].marker = L.marker([lat, lon]).addTo(mapas[containerId].map).bindPopup('📍 Pedido').openPopup();
  }, err => {
    document.getElementById(textId).textContent = 'Error GPS: ' + err.message;
  });
};
