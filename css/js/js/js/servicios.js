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

  // Demo: simula una respuesta del servidor. Reemplazar por un fetch real cuando exista el backend.
  setTimeout(() => {
    resultado.textContent =
      "Encontramos disponibilidad de " + tipo.toLowerCase() + " cerca de " + ubicacion + ". Tiempo estimado: 12 min.";
  }, 1000);
      }
