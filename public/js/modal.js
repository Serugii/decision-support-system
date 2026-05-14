import { $ } from './utils.js';

let modalConfirmCallback = null;

export function initModal() {
  $('modalCancel').onclick = closeModal;

  $('modalConfirm').onclick = async () => {
    if (modalConfirmCallback) await modalConfirmCallback();
    closeModal();
  };

  $('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
}

export function openModal({ title, contentHTML, onConfirm, onOpen }) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = contentHTML;

  modalConfirmCallback = onConfirm;

  $('modalConfirm').style.display = onConfirm ? 'inline-block' : 'none';

  $('modal').classList.remove('hidden');

  if (onOpen) onOpen();
}

export function closeModal() {
  $('modal').classList.add('hidden');
  modalConfirmCallback = null;
}
