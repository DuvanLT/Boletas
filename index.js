const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require("mongoose");
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGODB_URL;

// Middleware para manejar datos JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Conexión a MongoDB
mongoose.connect(MONGOURL)
  .then(() => console.log("Conectado a MongoDB"))
  .catch(error => console.error("Error conectando a MongoDB:", error));

// Definición del esquema y modelo
const BoletaSchema = new mongoose.Schema({
  boleta: { type: Number, unique: true },
  documento: {type: String},
});
const Boletamodel = mongoose.model("Boleta", BoletaSchema);

// Función para obtener la cantidad de números específicos restantes
const obtenerCantidadNumerosEspecificosRestantes = async () => {
  const numerosEspecificos = [71430, 24115, 10218, 22791, 33148]; // Números específicos
  const yaExisten = await Boletamodel.find({
    boleta: { $in: numerosEspecificos }
  }).countDocuments();

  // Cantidad de números específicos restantes
  const cantidadRestante = numerosEspecificos.length - yaExisten;

  return cantidadRestante;
};
const generarBoletas = async (cantidad, documento) => {
  const rangoMin = 10000;    // Valor mínimo del rango
  const rangoMax = 39999;    // Valor máximo del rango
  
  const numerosEspecificos = [71430, 24115, 10218, 22791, 33148]; // Números específicos
  const minimoParaNumerosEspecificos = 10000; // Cantidad mínima de registros para habilitar números específicos
  
  // Contar cuántos números ya están en la base de datos
  const usados = await Boletamodel.countDocuments();
  
  // Verificar si se pueden generar números específicos
  const permitirNumerosEspecificos = usados >= minimoParaNumerosEspecificos;

  // Verificar cuántos de los números específicos ya están registrados
  const yaExisten = await Boletamodel.find({
    boleta: { $in: numerosEspecificos }
  }).countDocuments();

  const quedanNumerosEspecificos = permitirNumerosEspecificos 
    ? numerosEspecificos.length - yaExisten 
    : 0; // No quedan si no se permite generarlos

  const nuevosNumeros = [];
  let attempts = 0;

  while (nuevosNumeros.length < cantidad) {
    let numero;

    if (permitirNumerosEspecificos && quedanNumerosEspecificos > 0 && Math.random() < 0.015) {
      // Elegir un número específico no utilizado
      for (const num of numerosEspecificos) {
        const yaGenerado = nuevosNumeros.includes(num) || await Boletamodel.exists({ boleta: num });
        if (!yaGenerado) {
          numero = num;
          break;
        }
      }
    }

    // Si no se asignó un número específico, generar uno aleatorio
    if (!numero) {
      numero = Math.floor(rangoMin + Math.random() * (rangoMax - rangoMin + 1));
    }

    try {
      // Intentar guardar en la base de datos
      const boletaNumero = new Boletamodel({ boleta: numero, documento: documento });
      await boletaNumero.save();
      nuevosNumeros.push(numero); // Agregar a la lista si se guarda correctamente
    } catch (error) {
      if (error.code !== 11000) { // Ignorar errores de duplicado
        throw new Error('Error guardando en la base de datos.');
      }
    }

    attempts++;

    if (attempts > cantidad * 100) { // Evitar ciclos infinitos
      throw new Error('Demasiados intentos, no se pueden generar suficientes números únicos.');
    }
  }

  return nuevosNumeros;
};


// Rutas
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente.');
});

// Ruta para obtener la cantidad de números específicos restantes
app.get('/cantidad-numeros-restantes', async (req, res) => {
  try {
    const cantidadRestante = await obtenerCantidadNumerosEspecificosRestantes();
    res.json({ message: 'Cantidad de números restantes', cantidadRestante });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la cantidad de números restantes' });
  }
});

app.get('/obtener', async (req, res) => {
  try {
    // Incluye el campo 'document' en la consulta
    const numeros = await Boletamodel.find({}, { boleta: 1, documento: 1, _id: 0 });
    res.json({
      message: 'Operación exitosa',
      numeros,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
});

app.delete('/eliminar/:numero', async (req, res) => {
  const { numero } = req.params;
  const { password } = req.body; // Contraseña enviada en el cuerpo de la solicitud
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin124252'; // Contraseña fija o desde variable de entorno

  // Validar la contraseña
  if (password !== adminPassword) {
    return res.status(403).json({ error: 'Contraseña incorrecta. Acceso denegado.' });
  }

  try {
    const boleta = await Boletamodel.findOneAndDelete({ boleta: numero });
    if (!boleta) {
      return res.status(404).json({ error: 'Boleta no encontrada.' });
    }
    res.json({ message: 'Boleta eliminada con éxito.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la boleta.' });
  }
});

app.post('/send', async (req, res) => {
  const { name,name2,name3,name4, email, cantidad, phone, precioTotal, documento } = req.body;

  // Validación de datos de entrada
  const numBoletas = parseInt(cantidad, 10);
  if (!name || !email || isNaN(numBoletas) || numBoletas <= 0 || !documento) {
    return res.status(400).json({ error: 'Datos inválidos. Verifica el formulario.' });
  }

  let nuevosNumeros;
  const fileName = `datos-${Date.now()}.txt`;

  try {
    // Generar boletas con el documento asociado
    nuevosNumeros = await generarBoletas(numBoletas, documento);

   
  // Crear archivo .txt con formato de factura
  const fileContent = `
=========================================
          FACTURA SUEÑO EN RUEDAS
=========================================

GRAN RIFA N-MAX POR SUEÑO EN RUEDAS
-----------------------------------------
Fecha de emisión  : ${new Date().toLocaleString()}
Número de Factura : ${Date.now()}
-----------------------------------------

Cliente:
-----------------------------------------
Nombre            : ${name} ${name2} ${name3} ${name4}
Correo            : ${email}
Whatsapp          : ${phone}
Número de Documento: ${documento}

Detalles de la Compra:
-----------------------------------------
Cantidad de Boletas: ${cantidad}
Total a Pagar     : $${precioTotal.toFixed(2)}

Números Generados:
-----------------------------------------
${nuevosNumeros.map((num, idx) => `${idx + 1}. ${num}`).join('\n')}

=========================================
Gracias por participar. 
Los pasos pequeños también
Llevan a grandes metas, buena suerte! 
=========================================
`;

// Guardar archivo .txt
fs.writeFileSync(fileName, fileContent);


    // Configurar y enviar correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: `${email}, busdigital514@gmail.com`,
      subject: 'Factura boletas',
      text: 'Adjuntamos un archivo con los datos ingresados y los números generados. No olvides mandar el comprobante de pago vía WhatsApp. ¡Buena suerte!',
      attachments: [{ filename: fileName, path: `./${fileName}` }],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Correo enviado con éxito.', numeros: nuevosNumeros });
  } catch (error) {
    console.error('Error en el proceso:', error);
    res.status(500).json({ error: 'Error procesando la solicitud.' });
  } finally {
    // Eliminar archivo temporal
    if (fs.existsSync(fileName)) {
      fs.unlinkSync(fileName);
    }
  }
});


const FechaSchema = new mongoose.Schema({
  fecha: { type: String, required: true },
});

const FechaModel = mongoose.model('Fecha', FechaSchema);

// Endpoint para obtener la fecha
app.get('/fecha', async (req, res) => {
  try {
    const fecha = await FechaModel.findOne(); // Obtener el único documento
    if (!fecha) {
      return res.status(404).json({ message: 'Fecha no encontrada' });
    }
    res.json(fecha);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la fecha', error });
  }
});

// Endpoint para actualizar la fecha
app.put('/fecha', async (req, res) => {
  const { nuevaFecha } = req.body;

  try {
    // Actualizar la fecha (se asume un único documento en la colección)
    const resultado = await FechaModel.findOneAndUpdate(
      {}, // Filtro (actualizar el único documento)
      { $set: { fecha: nuevaFecha } },
      { new: true, upsert: true } // `upsert` para crear el documento si no existe
    );
    res.json({ message: 'Fecha actualizada exitosamente', fecha: resultado });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la fecha', error });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose`);
});
