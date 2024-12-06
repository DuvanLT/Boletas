const slides = document.querySelector('.slides');
const slideCount = document.querySelectorAll('.slide').length;
let currentIndex = 0;

document.querySelector('.prev').addEventListener('click', () => {
  currentIndex = (currentIndex > 0) ? currentIndex - 1 : slideCount - 1;
  updateSlider();
});

document.querySelector('.next').addEventListener('click', () => {
  currentIndex = (currentIndex < slideCount - 1) ? currentIndex + 1 : 0;
  updateSlider();
});

function updateSlider() {
  const slideWidth = document.querySelector('.slider').clientWidth;
  slides.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
}
