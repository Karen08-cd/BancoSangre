const form = document.getElementById("formMensaje");
const respuesta = document.getElementById("respuesta");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const mensaje = document.getElementById("mensaje").value.trim();
  const telefono = document.getElementById("telefono").value.trim();

  if (!/^3\d{9}$/.test(telefono)) {
    respuesta.style.color = "red";
    respuesta.innerText = "❌ Teléfono inválido";
    return;
  }

  try {
    // Guardar en Excel
    const resGuardar = await fetch("http://localhost:3000/api/mensajes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje, telefono })
    });

    const dataGuardar = await resGuardar.json();
    if (!resGuardar.ok) {
      respuesta.style.color = "red";
      respuesta.innerText = dataGuardar.error;
      return;
    }

    // Enviar SMS
    const resSMS = await fetch("http://localhost:3000/api/sms/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje, telefono })
    });

    const dataSMS = await resSMS.json();
    if (!resSMS.ok) {
      respuesta.style.color = "red";
      respuesta.innerText = dataSMS.error;
      return;
    }

    respuesta.style.color = "green";
    respuesta.innerText = "✅ Mensaje enviado por SMS";
    form.reset();

  } catch (error) {
    console.error(error);
    respuesta.style.color = "red";
    respuesta.innerText = "❌ Error de conexión";
  }
});
