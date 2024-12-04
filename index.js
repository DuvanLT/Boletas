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

// Función para generar números únicos y almacenarlos en la base de datos
const generarBoletas = async (cantidad, documento) => {
  const rangoMin = 10000;    // Valor mínimo del rango (ej. 10000)
  const rangoMax = 39999;    // Valor máximo del rango (ej. 39999)
  
  const numerosEspecificos = [71430, 24115, 10218, 22791, 33148]; // Números que solo pueden generarse si hay más de 10,000 boletas

  // Contar cuántos números ya están en la base de datos
  const usados = await Boletamodel.countDocuments();

  // Verificar cuántos de los números específicos ya están registrados
  const yaExisten = await Boletamodel.find({
    boleta: { $in: numerosEspecificos }
  }).countDocuments();

  // Si todos los números específicos ya están generados, entonces no los intentamos
  const quedanNumerosEspecificos = numerosEspecificos.length - yaExisten;

  const nuevosNumeros = [];
  let attempts = 0;

  // La cantidad de intentos se puede definir para aumentar las probabilidades de encontrar números únicos
  while (nuevosNumeros.length < cantidad) {
    let numero;

    // Si quedan números específicos por generar, los intentamos generar
    if (quedanNumerosEspecificos > 0 && Math.random() < 0.2) {
      // Elegir uno de los números específicos que aún no se han asignado
      numero = numerosEspecificos.find(num => !nuevosNumeros.includes(num));
    } else {
      // Generar un número aleatorio en el rango permitido
      numero = Math.floor(rangoMin + Math.random() * (rangoMax - rangoMin + 1)); 
    }

    try {
      // Intentar insertar directamente en la base de datos con el documento asociado
      const boletaNumero = new Boletamodel({ boleta: numero, documento: documento });
      await boletaNumero.save(); // Si se genera duplicado, Mongo lanza error
      nuevosNumeros.push(numero); // Añadir a la lista de números generados
    } catch (error) {
      // Si ocurre un error, asumimos que el número ya existe (código de error de MongoDB para duplicados)
      if (error.code !== 11000) { // Código 11000 = Duplicado en MongoDB
        throw new Error('Error guardando en la base de datos.');
      }
      // Si el número ya existe, continuar con el siguiente intento
    }

    attempts++;

    // Verificar si hemos alcanzado el máximo de intentos permitidos
    if (attempts > cantidad * 100) { // Intentos excesivos, por si acaso
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
  const adminPassword = process.env.ADMIN_PASSWORD || '12345'; // Contraseña fija o desde variable de entorno

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
  const { name, email, message, cantidad, phone, precioTotal, documento } = req.body;

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

    // Crear archivo .txt
    const fileContent = `
Nombre: ${name}
Correo: ${email}
Whatsapp: ${phone}
Numero de Documento: ${documento}
Mensaje: ${message}
Cantidad: ${cantidad}
Total: ${precioTotal}

Números Generados:
${nuevosNumeros.join('\n')}`;
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en https://gran-rifa.vercel.app:${PORT}`);
});
