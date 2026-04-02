export const $ = (id) => document.getElementById(id);

export function isEmpty(value) {
  return !value || value.trim() === '';
}

export function showToast(message, type = 'error', duration = 4000) {
  const toast = $('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = 'toast';
  }, duration);
}
