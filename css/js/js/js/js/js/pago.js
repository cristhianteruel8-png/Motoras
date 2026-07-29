function pagar() {
  const resultado = document.getElementById("pagoResultado");
  const boton = document.getElementById("btnPagar");

  boton.disabled = true;
  boton.textContent = "Procesando...";
  resultado.style.display = "block";
  resultado.textContent = "Procesando pago...";

  // Demo: acá iría la integración real con la pasarela de pago (Mercado Pago, Stripe, etc.)
  setTimeout(() => {
    resultado.textContent = "Pago confirmado. ¡Gracias! Ya podés ver tu diagnóstico.";
    boton.textContent = "Pagado ✔";
  }, 1200);
}
