document.addEventListener('DOMContentLoaded', () => {
  // Tab Switching
  const tabBtns = document.querySelectorAll('.v3-tab-btn');
  const tabPanes = document.querySelectorAll('.v3-tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(`tab-${target}`);
      if (activePane) {
        activePane.classList.add('active');
      }
    });
  });

  // Current Year
  const yearSpan = document.getElementById('v3-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
