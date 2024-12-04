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
            alert("Error al obtener los datos");
          }
        } catch (error) {
          console.error("Error en la solicitud:", error);
          alert("Error en la solicitud");
        }
      }
  
      // Llamada para obtener la cantidad de números restantes al cargar la página
      obtenerNumerosRestantes();