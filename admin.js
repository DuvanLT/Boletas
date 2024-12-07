document.getElementById('obtener').addEventListener('click', async () => {
  try {
    const response = await fetch('https://boletas-9g64.onrender.com/obtener');

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    const resultado = document.getElementById('numeros');
    resultado.innerHTML = '';

    const numeros = document.createElement('ul');
    data.numeros.forEach(({ boleta, documento }) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>Número:</strong> ${boleta} | <strong>Documento:</strong> ${documento}`;

      li.addEventListener('click', async () => {
        const password = prompt(`Por favor, ingresa la contraseña para eliminar el número ${boleta}:`);

        if (!password) {
          alert('Operación cancelada. No se ingresó ninguna contraseña.');
          return;
        }

        try {
          const response = await fetch(`https://boletas-9g64.onrender.com/eliminar/${boleta}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar la boleta.');
          }

          li.remove();
          alert('Número eliminado con éxito.');
        } catch (error) {
          console.error('Error al eliminar la boleta:', error);
          alert('Hubo un error al eliminar la boleta: ' + error.message);
        }
      });

      numeros.appendChild(li);
    });
    resultado.appendChild(numeros);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    const resultado = document.getElementById('resultado');
    resultado.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
});


document.getElementById('downloadBtn').addEventListener('click', () => {
  fetch('https://boletas-9g64.onrender.com/download-excel')
    .then(response => {
      if (response.ok) {
        return response.blob();  // Obtener el archivo como blob
      } else {
        throw new Error('No hay datos disponibles para generar el Excel');
      }
    })
    .then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'boletas.xlsx';
      link.click();
    })
    .catch(error => alert(error.message));
});

async function actualizarFecha(event) {
  event.preventDefault(); // Prevenir el envío del formulario

  const nuevaFecha = document.getElementById('nuevaFecha').value;

  if (!nuevaFecha) {
      alert('Por favor ingrese una nueva fecha.');
      return;
  }

  async function obtenerFecha() {
    try {
        const response = await fetch('https://boletas-9g64.onrender.com/fecha');
        const data = await response.json();
        if (data.fecha) {
            document.getElementById('fechaActual').textContent = data.fecha;
        } else {
            document.getElementById('fechaActual').textContent = 'No se encontró la fecha';
        }
    } catch (error) {
        console.error('Error al obtener la fecha:', error);
    }
  }
  

  try {
      const response = await fetch('https://boletas-9g64.onrender.com/fecha', {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nuevaFecha }),
      });

      if (response.ok) {
          const data = await response.json();
          alert('Fecha actualizada exitosamente');
          obtenerFecha(); // Volver a obtener la fecha después de la actualización
          document.getElementById('nuevaFecha').value = ''; // Limpiar el campo de entrada
      } else {
          alert('Error al actualizar la fecha');
      }
  } catch (error) {
      console.error('Error al actualizar la fecha:', error);
  }
}

// Asignar la función de actualización al formulario
document.getElementById('formActualizarFecha').addEventListener('submit', actualizarFecha);

// Obtener la fecha cuando la página cargue
window.onload = obtenerFecha;
