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
