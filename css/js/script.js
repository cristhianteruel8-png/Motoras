// ===== Diagnóstico IA =====
const URL_API = "http://localhost:3000/ia/diagnostico";

async function diagnosticar() {
  const problema = document.getElementById("problema").value.trim();
  const codigo = document.getElementById("codigo").value.trim();
  const resultado = document.getElementById("respuestaIA");
  const boton = document.getElementById("btnDiagnosticar");

  if (!problema) {
    resultado.textContent = "Describí la falla antes de analizar.";
    resultado.classList.add("error");
    return;
  }

  resultado.classList.remove("error");
  resultado.textContent = "Analizando...";
  boton.disabled = true;

  try {
    const respuesta = await fetch(URL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problema: problema,
        sintomas: problema,
        codigo: codigo || null
      })
    });

    if (!respuesta.ok) {
      throw new Error("El servidor respondió con estado " + respuesta.status);
    }

    const datos = await respuesta.json();

    if (datos && datos.resultado) {
      resultado.textContent = datos.resultado;
    } else {
      resultado.textContent = "El servidor no devolvió un diagnóstico. Probá de nuevo.";
      resultado.classList.add("error");
    }
  } catch (error) {
    resultado.textContent = "No se pudo conectar con el servidor de diagnóstico. Verificá que esté corriendo.";
    resultado.classList.add("error");
  } finally {
    boton.disabled = false;
  }
}

// ===== Usuario =====
function guardarUsuario() {
  const resultado = document.getElementById("usuarioResultado");

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const auto = document.getElementById("auto").value.trim();
  const anio = document.getElementById("anio").value.trim();
  const motor = document.getElementById("motor").value.trim();

  if (!nombre || !email || !auto) {
    mostrarResultado(resultado, "Completá al menos nombre, email y vehículo.", true);
    return;
  }

  const usuario = { nombre, email, auto, anio, motor };

  try {
    localStorage.setItem("motoras_usuario", JSON.stringify(usuario));
    mostrarResultado(
      resultado,
      `Datos guardados. ¡Hola, ${nombre}! Vehículo: ${auto} (${anio || "año no indicado"})`,
      false
    );
  } catch (error) {
    mostrarResultado(resultado, "No se pudieron guardar los datos en este navegador.", true);
  }
}

function mostrarResultado(elemento, texto, esError) {
  elemento.style.display = "block";
  elemento.textContent = texto;
  elemento.classList.toggle("error", esError);
}

// ===== Servicios =====
function buscarServicio() {
  const tipo = document.getElementById("tipoServicio").value;
  const ubicacion = document.getElementById("ubicacion").value.trim();
  const resultado = document.getElementById("servicioResultado");

  if (!ubicacion) {
    resultado.style.display = "block";
    resultado.classList.add("error");
    resultado.textContent = "Ingresá la ubicación del vehículo para buscar ayuda.";
    return;
  }

  resultado.classList.remove("error");
  resultado.style.display = "block";
  resultado.textContent = "Buscando " + tipo.toLowerCase() + " cerca de " + ubicacion + "...";

  setTimeout(() => {
    resultado.textContent =
      "Encontramos disponibilidad de " + tipo.toLowerCase() + " cerca de " + ubicacion + ". Tiempo estimado: 12 min.";
  }, 1000);
}

// ===== Prestador =====
function aceptarTrabajo() {
  const estado = document.getElementById("estadoPedido");
  const trabajo = document.getElementById("trabajo");
  const boton = document.getElementById("btnAceptar");

  estado.textContent = "Aceptado";
  boton.disabled = true;
  boton.textContent = "Trabajo aceptado";

  trabajo.style.display = "block";
  trabajo.textContent = "Contactá al cliente para coordinar el servicio.";
}

// ===== Pago =====
function pagar() {
  const resultado = document.getElementById("pagoResultado");
  const boton = document.getElementById("btnPagar");

  boton.disabled = true;
  boton.textContent = "Procesando...";
  resultado.style.display = "block";
  resultado.textContent = "Procesando pago...";

  setTimeout(() => {
    resultado.textContent = "Pago confirmado. ¡Gracias! Ya podés ver tu diagnóstico.";
    boton.textContent = "Pagado ✔";
  }, 1200);
}

// ===== Calificación =====
function calificar() {
  const estrellas = document.getElementById("estrellas").value;
  const resultado = document.getElementById("calificacionResultado");

  resultado.style.display = "block";
  resultado.textContent = "¡Gracias por calificar el servicio con " + estrellas + "!";
      }
