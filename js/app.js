const supabaseClient = supabase.createClient(
  'https://zeidclylnspvmqfnojtq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWRjbHlsbnNwdm1xZm5vanRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NTMxOTIsImV4cCI6MjEwMTAyOTE5Mn0.r-0PBjCs6SQRYXtnZjzyOZbzHgPlzBt-pvDq6CKjtqI'
);

/* ---------- PESTAÑAS LOGIN / REGISTRO ---------- */
function cambiarTab(seccion, tab, boton) {
  document.getElementById(seccion + '-login').classList.toggle('activo-tab-panel', tab === 'login');
  document.getElementById(seccion + '-registro').classList.toggle('activo-tab-panel', tab === 'registro');
  document.querySelectorAll('#' + seccion + ' .tab-btn').forEach(function (b) {
    b.classList.remove('activo-tab');
  });
  boton.classList.add('activo-tab');
}

/* ---------- USUARIO ---------- */
async function registrarUsuarioReal() {
  const nombre = document.getElementById('nombre').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('passUsuario').value;
  const auto = document.getElementById('auto').value;
  const anio = document.getElementById('anio').value;
  const motor = document.getElementById('motor').value;

  const div = document.getElementById('usuarioResultado');
  div.style.display = 'block';
  div.textContent = 'Creando cuenta...';

  let userId = null;
  const { data, error } = await supabaseClient.auth.signUp({ email, password });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      const { data: dataLogin, error: errorLogin } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (errorLogin) {
        div.textContent = 'Ese email ya tiene una cuenta. Ingresá la contraseña correcta de esa cuenta para sumarle el perfil de usuario.';
        return;
      }
      userId = dataLogin.user.id;
    } else {
      div.textContent = 'Error: ' + error.message;
      return;
    }
  } else {
    userId = data.user.id;
  }

  const { error: errorPerfil } = await supabaseClient
    .from('perfiles_usuario')
    .upsert([{ id: userId, nombre, auto, anio, motor }]);

  div.textContent = errorPerfil
    ? 'Cuenta lista, pero hubo un error guardando el perfil: ' + errorPerfil.message
    : 'Perfil de usuario guardado. Ya podés iniciar sesión.';
}

async function iniciarSesionUsuarioReal() {
  const email = document.getElementById('loginEmailUsuario').value;
  const password = document.getElementById('loginPassUsuario').value;
  const div = document.getElementById('usuarioResultado');
  div.style.display = 'block';
  div.textContent = 'Iniciando sesión...';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    div.textContent = 'Error: ' + error.message;
    return;
  }
  document.getElementById('usuarioAuthBox').style.display = 'none';
  document.getElementById('usuarioPanel').style.display = 'block';
}

async function cerrarSesionUsuario() {
  try {
    await supabaseClient.auth.signOut();
  } catch (e) {
    console.error(e);
  }
  document.getElementById('usuarioPanel').style.display = 'none';
  document.getElementById('usuarioAuthBox').style.display = 'block';
  document.getElementById('usuarioResultado').style.display = 'none';
}

/* ---------- PRESTADOR ---------- */
async function registrarPrestadorReal() {
  const nombre = document.getElementById('nombrePrestador').value;
  const email = document.getElementById('emailPrestador').value;
  const password = document.getElementById('passPrestador').value;
  const tipo = document.getElementById('tipoPrestador').value;
  const zona = document.getElementById('zonaPrestador').value;

  const div = document.getElementById('prestadorResultado');
  div.style.display = 'block';
  div.textContent = 'Registrando...';

  let userId = null;
  const { data, error } = await supabaseClient.auth.signUp({ email, password });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      const { data: dataLogin, error: errorLogin } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (errorLogin) {
        div.textContent = 'Ese email ya tiene una cuenta. Ingresá la contraseña correcta de esa cuenta para sumarle el perfil de prestador.';
        return;
      }
      userId = dataLogin.user.id;
    } else {
      div.textContent = 'Error: ' + error.message;
      return;
    }
  } else {
    userId = data.user.id;
  }

  const { error: errorPerfil } = await supabaseClient
    .from('perfiles_prestador')
    .upsert([{ id: userId, nombre, tipo, zona }]);

  div.textContent = errorPerfil
    ? 'Cuenta lista, pero hubo un error guardando el perfil: ' + errorPerfil.message
    : 'Perfil de prestador guardado. Ya podés iniciar sesión.';
}

async function iniciarSesionPrestadorReal() {
  const email = document.getElementById('loginEmailPrestador').value;
  const password = document.getElementById('loginPassPrestador').value;
  const div = document.getElementById('prestadorResultado');
  div.style.display = 'block';
  div.textContent = 'Iniciando sesión...';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    div.textContent = 'Error: ' + error.message;
    return;
  }
  document.getElementById('prestadorAuthBox').style.display = 'none';
  document.getElementById('prestadorPanel').style.display = 'block';
  cargarPedidosReal();
}

async function cerrarSesionPrestador() {
  try {
    await supabaseClient.auth.signOut();
  } catch (e) {
    console.error(e);
  }
  document.getElementById('prestadorPanel').style.display = 'none';
  document.getElementById('prestadorAuthBox').style.display = 'block';
  document.getElementById('prestadorResultado').style.display = 'none';
}

/* ---------- DIAGNÓSTICO Y PEDIDOS ---------- */
async function guardarDiagnosticoReal() {
  const problema = document.getElementById('problema').value;
  const codigo = document.getElementById('codigo').value;
  const div = document.getElementById('respuestaIA');

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    div.textContent = 'Iniciá sesión como usuario primero para guardar tu diagnóstico.';
    return;
  }

  div.textContent = 'Guardando diagnóstico...';

  const { error } = await supabaseClient
    .from('diagnosticos')
    .insert([{ usuario_id: user.id, problema, codigo }]);

  div.textContent = error
    ? 'Error al guardar: ' + error.message
    : 'Diagnóstico guardado. Pronto vamos a conectar el análisis con IA real.';
}

async function guardarPedidoReal() {
  const tipoServicio = document.getElementById('tipoServicio').value;
  const ubicacion = document.getElementById('ubicacion').value;
  const div = document.getElementById('servicioResultado');
  div.style.display = 'block';

  if (!ubicacion || pedidoLat === null) {
    div.textContent = 'Primero elegí tu ubicación con el botón o tocando el mapa.';
    return;
  }

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    div.textContent = 'Iniciá sesión como usuario primero para pedir ayuda.';
    return;
  }

  div.textContent = 'Enviando pedido...';

  const { error } = await supabaseClient
    .from('pedidos')
    .insert([{ usuario_id: user.id, tipo_servicio: tipoServicio, ubicacion, lat: pedidoLat, lon: pedidoLon }]);

  div.textContent = error
    ? 'Error al guardar: ' + error.message
    : 'Pedido enviado. Un prestador lo va a ver pronto.';
}

/* ---------- UBICACIÓN DEL PEDIDO (mapa / GPS, sin escribir a mano) ---------- */
let mapaPedido = null;
let marcadorPedido = null;
let pedidoLat = null;
let pedidoLon = null;

function iniciarMapaPedido() {
  if (mapaPedido) return;
  mapaPedido = L.map('mapaServicios').setView([-31.4, -64.2], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(mapaPedido);
  mapaPedido.on('click', function (e) {
    colocarPedidoEnMapa(e.latlng.lat, e.latlng.lng);
  });
}

function usarMiUbicacionPedido() {
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta GPS.');
    return;
  }
  document.getElementById('ubicacionServiciosTexto').innerHTML = 'Buscando tu ubicación...';
  navigator.geolocation.getCurrentPosition(function (pos) {
    colocarPedidoEnMapa(pos.coords.latitude, pos.coords.longitude);
  }, function (err) {
    document.getElementById('ubicacionServiciosTexto').innerHTML =
      'No se pudo obtener tu ubicación: ' + err.message + '. Podés tocar el mapa para marcarla manualmente.';
    iniciarMapaPedido();
  });
}

async function colocarPedidoEnMapa(lat, lon) {
  iniciarMapaPedido();
  mapaPedido.setView([lat, lon], 15);
  setTimeout(function () { mapaPedido.invalidateSize(); }, 100);

  if (marcadorPedido) {
    marcadorPedido.setLatLng([lat, lon]);
  } else {
    marcadorPedido = L.marker([lat, lon], { draggable: true }).addTo(mapaPedido);
    marcadorPedido.on('dragend', function () {
      const pos = marcadorPedido.getLatLng();
      colocarPedidoEnMapa(pos.lat, pos.lng);
    });
  }

  pedidoLat = lat;
  pedidoLon = lon;
  document.getElementById('ubicacionServiciosTexto').innerHTML = 'Buscando la dirección...';

  try {
    const resp = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon);
    const data = await resp.json();
    const direccion = data.display_name || (lat.toFixed(5) + ', ' + lon.toFixed(5));
    document.getElementById('ubicacion').value = direccion;
    document.getElementById('ubicacionServiciosTexto').innerHTML = '📍 ' + direccion;
  } catch (e) {
    const coordsTxt = lat.toFixed(5) + ', ' + lon.toFixed(5);
    document.getElementById('ubicacion').value = coordsTxt;
    document.getElementById('ubicacionServiciosTexto').innerHTML = '📍 ' + coordsTxt;
  }
}

/* ---------- PEDIDOS DEL PRESTADOR ---------- */
async function cargarPedidosReal() {
  const div = document.getElementById('listaPedidos');
  div.innerHTML = '<div class="resultado">Cargando pedidos...</div>';

  const { data, error } = await supabaseClient
    .from('pedidos')
    .select('*')
    .eq('estado', 'Esperando aceptación')
    .order('creado_en', { ascending: false });

  if (error) {
    div.innerHTML = '<div class="resultado error">Error: ' + error.message + '</div>';
    return;
  }

  if (!data || data.length === 0) {
    div.innerHTML = '<div class="resultado">No hay pedidos pendientes por ahora.</div>';
    return;
  }

  div.innerHTML = data.map(function (p) {
    return '<div class="resultado">' +
      'Servicio: ' + p.tipo_servicio + '<br>' +
      'Ubicación: ' + (p.ubicacion || 'No especificada') + '<br>' +
      'Estado: ' + p.estado +
      '<button class="btn" onclick="aceptarPedidoReal(\'' + p.id + '\')">Aceptar trabajo</button>' +
      '</div>';
  }).join('');
}

async function aceptarPedidoReal(pedidoId) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { error } = await supabaseClient
    .from('pedidos')
    .update({ estado: 'Aceptado', prestador_id: user.id })
    .eq('id', pedidoId);

  if (error) {
    alert('Error al aceptar: ' + error.message);
    return;
  }
  cargarPedidosReal();
}

/* ---------- MAPA DEL PRESTADOR ---------- */
const mapas = {};

function obtenerUbicacion(containerId, textId) {
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta GPS.');
    return;
  }

  document.getElementById(textId).innerHTML = 'Buscando ubicación...';

  navigator.geolocation.getCurrentPosition(function (pos) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    document.getElementById(textId).innerHTML =
      '📍 Latitud: ' + lat + '<br>📍 Longitud: ' + lon;

    if (!mapas[containerId]) {
      const mapa = L.map(containerId).setView([lat, lon], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapa);
      mapas[containerId] = { map: mapa, marker: null };
    } else {
      mapas[containerId].map.setView([lat, lon], 14);
      if (mapas[containerId].marker) {
        mapas[containerId].map.removeLayer(mapas[containerId].marker);
      }
    }

    // Fuerza a Leaflet a recalcular el tamaño del contenedor (evita mapas en blanco)
    setTimeout(function () {
      mapas[containerId].map.invalidateSize();
    }, 100);

    mapas[containerId].marker = L.marker([lat, lon])
      .addTo(mapas[containerId].map)
      .bindPopup('📍 Tu ubicación')
      .openPopup();

    /* DEMO */
    L.marker([lat + 0.01, lon + 0.005]).addTo(mapas[containerId].map).bindPopup('🔧 Mecánico Motoras');
    L.marker([lat - 0.008, lon - 0.004]).addTo(mapas[containerId].map).bindPopup('🚚 Grúa');
    L.marker([lat + 0.006, lon - 0.01]).addTo(mapas[containerId].map).bindPopup('🏢 Taller');
  }, function (err) {
    document.getElementById(textId).innerHTML =
      'No se pudo obtener la ubicación: ' + err.message + '. Revisá que el navegador tenga permiso de ubicación activado para este sitio.';
  });
}
