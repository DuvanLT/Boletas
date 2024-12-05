document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelector('.slides');
    const images = document.querySelectorAll('.slides img');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    
    let currentIndex = 0;
  
    const updateSlider = () => {
      const slideWidth = images[0].clientWidth;
      slides.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    };
  
    nextButton.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % images.length; // Avanza en bucle
      updateSlider();
    });
  
    prevButton.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + images.length) % images.length; // Retrocede en bucle
      updateSlider();
    });
  
    // Ajusta el slider si la ventana cambia de tamaño
    window.addEventListener('resize', updateSlider);
  });
  