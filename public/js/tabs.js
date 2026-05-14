const tabChangeCallbacks = {};

export function onTabChange(tabName, callback) {
  tabChangeCallbacks[tabName] = callback;
}

export function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');

      if (tabChangeCallbacks[target]) {
        tabChangeCallbacks[target]();
      }
    });
  });
}

export function switchToTab(tabName) {
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (btn) btn.click();
}
