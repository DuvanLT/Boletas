// Actualiza el precio dinámicamente según la cantidad ingresada
document.getElementById('cantidad').addEventListener('input', (event) => {
  const cantidad = parseInt(event.target.value, 10) || 0 // Asegurar un número válido
  const precioUnitario = 15000 // Precio por boleta
  const precioTotal = cantidad * precioUnitario // Calcular total
  document.getElementById('price').innerText = `$${precioTotal.toLocaleString('es-CO')}` // Formatear precio
});

// Manejador para enviar el formulario
document.getElementById('dataForm').addEventListener('submit', async (e) => {
  e.preventDefault() // Evitar el comportamiento predeterminado del formulario

  // Capturar valores del formulario
  const name = document.getElementById('name').value.trim()
  const name2 = document.getElementById('name2').value.trim()
  const name3= document.getElementById('name3').value.trim()
  const name4 = document.getElementById('name4').value.trim()
  const email = document.getElementById('email').value.trim()
  const phone = document.getElementById('phone').value.trim()
  const documento = document.getElementById('documento').value.trim()
  const cantidad = parseInt(document.getElementById('cantidad').value, 10) || 0;
  const precioUnitario = 15000;
  const precioTotal = cantidad * precioUnitario

  // Validaciones básicas
  if (!name || !email || cantidad <= 0) {
    alert('Por favor, completa todos los campos obligatorios y asegúrate de ingresar una cantidad válida.')
    return
  }

  try {
    // Mostrar estado de carga
    const submitButton = e.target.querySelector('button[type="submit"]')
    submitButton.disabled = true
    submitButton.innerText = 'Enviando...'

    // Enviar solicitud al servidor
    const response = await fetch('https://boletas-9g64.onrender.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name,name2,name3,name4, email, phone, cantidad, precioTotal,documento }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error desconocido en el servidor.')
    }

    const result = await response.json()

    // Mostrar números generados al usuario
    alert(`¡Correo enviado con éxito! Tus números generados son: ${result.numeros.join(', ')}`)
  } catch (error) {
    console.error('Error:', error)

    // Enlace de WhatsApp en caso de error
    const whatsappLink = "https://api.whatsapp.com/send?phone=+573243020663&text=HOLA%21%21+%2C+me+interesa+informaci%C3%B3n+sobre+mi+futura+N.max+ultimo+modelo+"
    window.open(whatsappLink, '_blank')

    alert(`Hubo un error al enviar tu solicitud. Hemos generado un enlace para contactarnos por WhatsApp.`)
  } finally {
    // Restaurar botón de envío
    const submitButton = e.target.querySelector('button[type="submit"]')
    submitButton.disabled = false
    submitButton.innerText = 'Enviar'
  }
})
