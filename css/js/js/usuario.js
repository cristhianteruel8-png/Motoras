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
