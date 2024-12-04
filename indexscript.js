// Función para obtener la fecha
async function obtenerFecha() {
    try {
      // Realizamos la solicitud al backend para obtener la fecha
      const response = await fetch('https://boletas-9g64.onrender.com/fecha');
      
      if (!response.ok) {
        throw new Error('No se pudo obtener la fecha.');
      }
  
      const data = await response.json();
      // Si la fecha está disponible, actualizamos el span
      if (data.fecha) {
        document.getElementById('fechaJuego').textContent = data.fecha;
      } else {
        document.getElementById('fechaJuego').textContent = 'Fecha no disponible';
      }
    } catch (error) {
      console.error('Error al obtener la fecha:', error);
      document.getElementById('fechaJuego').textContent = 'Error al cargar la fecha';
    }
  }
  
  // Llamamos a la función al cargar la página
  window.onload = obtenerFecha;
  