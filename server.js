require("dotenv").config();
const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const fs = require("fs");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const FILE = "mensajes.xlsx";

/* ===============================
   CREAR EXCEL SI NO EXISTE
================================ */
if (!fs.existsSync(FILE)) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([]);
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  XLSX.writeFile(wb, FILE);
  console.log("✅ Archivo Excel creado");
}

/* ===============================
   GUARDAR MENSAJE EN EXCEL
================================ */
app.post("/api/mensajes", (req, res) => {
  const { mensaje, telefono } = req.body;

  if (!telefono || !mensaje) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  if (!/^3\d{9}$/.test(telefono)) {
    return res.status(400).json({ error: "Teléfono inválido" });
  }

  if (mensaje.trim().length < 5) {
    return res.status(400).json({ error: "Mensaje muy corto" });
  }

  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets["Datos"];
  const data = XLSX.utils.sheet_to_json(ws);

  data.push({
    fecha: new Date().toLocaleString(),
    telefono,
    mensaje: mensaje.trim()
  });

  wb.Sheets["Datos"] = XLSX.utils.json_to_sheet(data);
  XLSX.writeFile(wb, FILE);

  res.json({ message: "✅ Mensaje guardado" });
});

/* ===============================
   CONSULTAR MENSAJES
================================ */
app.get("/api/mensajes", (req, res) => {
  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets["Datos"];
  res.json(XLSX.utils.sheet_to_json(ws));
});

/* ===============================
   ENVÍO DE SMS CON LIWA (OFICIAL)
================================ */
app.post("/api/sms/enviar", async (req, res) => {
  // Acepta frontend y Postman
  const telefono = req.body.telefono || req.body.number;
  const mensaje = req.body.mensaje || req.body.message;
  const type = req.body.type || 1;

  if (!telefono || !mensaje) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    const response = await axios.post(
      "https://api.liwa.co/v2/sms/single",
      {
        number: telefono.startsWith("57") ? telefono : `57${telefono}`,
        message: mensaje,
        type: type
      },
      {
        headers: {
          "x-api-key": process.env.LIWA_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      success: true,
      messageId: response.data,
      info: "Solicitud aceptada por LIWA"
    });

  } catch (error) {
    console.error("❌ LIWA ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: "Fallo proveedor SMS",
      detalle: error.response?.data || error.message
    });
  }
});

/* ===============================
   RUTA RAÍZ
================================ */
app.get("/", (req, res) => {
  res.send("✅ API Banco de Sangre funcionando");
});

/* ===============================
   INICIAR SERVIDOR
================================ */
app.listen(PORT, () => {
  console.log(`✅ API corriendo en http://localhost:${PORT}`);
});
