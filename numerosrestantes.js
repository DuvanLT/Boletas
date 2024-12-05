      // Función para obtener la cantidad de números restantes
      async function obtenerNumerosRestantes() {
        const apiUrl = "https://boletas-9g64.onrender.com/cantidad-numeros-restantes";  // Ajusta esta URL si es necesario
  
        try {
          const response = await fetch(apiUrl);
          const data = await response.json();
  
          if (response.ok) {
            // Actualiza el contenido del elemento con el id 'numeroBendecido'
            document.getElementById("numeroBendecido").textContent = data.cantidadRestante;
          } else {
            console.error(data.error);
          }
        } catch (error) {
        }
      }
  
      // Llamada para obtener la cantidad de números restantes al cargar la página
      obtenerNumerosRestantes();