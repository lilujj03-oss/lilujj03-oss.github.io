const header = document.querySelector('.header');
const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
const year = document.getElementById('year');

if (year) {
  year.textContent = new Date().getFullYear();
}

window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    header?.classList.add('scrolled');
  } else {
    header?.classList.remove('scrolled');
  }
});

menuButton?.addEventListener('click', () => {
  const isOpen = navLinks?.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});
