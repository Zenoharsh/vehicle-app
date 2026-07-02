
let currentSlide = 0;
const heroImages = [];
for (let i = 1; i <= 13; i++) {
  heroImages.push(`assets/hero-${i}.jpeg`);
}
let carouselTimer = null;

function initCarousel() {
  const container = document.getElementById('carousel-images');
  if (!container) return;
  
  container.innerHTML = '';
  heroImages.forEach((src, i) => {
    container.innerHTML += `
      <img src="${src}" class="absolute inset-0 w-full h-full object-contain bg-white transition-opacity duration-1000 ${i === 0 ? 'opacity-100' : 'opacity-0'}" id="slide-${i}">
    `;
  });
  
  if (carouselTimer) clearInterval(carouselTimer);
  carouselTimer = setInterval(() => { window.nextSlide() }, 5000);
}

window.nextSlide = function() {
  const oldSlide = document.getElementById(`slide-${currentSlide}`);
  if (oldSlide) oldSlide.classList.replace('opacity-100', 'opacity-0');
  
  currentSlide = (currentSlide + 1) % heroImages.length;
  
  const newSlide = document.getElementById(`slide-${currentSlide}`);
  if (newSlide) newSlide.classList.replace('opacity-0', 'opacity-100');
};

window.prevSlide = function() {
  const oldSlide = document.getElementById(`slide-${currentSlide}`);
  if (oldSlide) oldSlide.classList.replace('opacity-100', 'opacity-0');
  
  currentSlide = (currentSlide - 1 + heroImages.length) % heroImages.length;
  
  const newSlide = document.getElementById(`slide-${currentSlide}`);
  if (newSlide) newSlide.classList.replace('opacity-0', 'opacity-100');
};
