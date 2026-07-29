function calificar() {
  const estrellas = document.getElementById("estrellas").value;
  const resultado = document.getElementById("calificacionResultado");

  resultado.style.display = "block";
  resultado.textContent = "¡Gracias por calificar el servicio con " + estrellas + "!";
}
