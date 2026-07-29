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
