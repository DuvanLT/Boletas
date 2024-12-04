document.getElementById('obtener').addEventListener('click', async () => {
  try {
    const response = await fetch('https://gran-rifa.vercel.app/obtener');

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
          const response = await fetch(`https://gran-rifa.vercel.app/eliminar/${boleta}`, {
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
