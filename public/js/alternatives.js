import { api } from './api.js';
import { $, isEmpty, showToast } from './utils.js';
import { openModal } from './modal.js';
import { loadMatrix } from './matrix.js';

export function initAlternatives() {
  $('addAltBtn').addEventListener('click', createAlternative);

  $('altName').addEventListener('input', toggleButton);
  $('altDesc').addEventListener('input', toggleButton);

  toggleButton();
  loadAlternatives();
}

function toggleButton() {
  $('addAltBtn').disabled =
    isEmpty($('altName').value) || isEmpty($('altDesc').value);
}

export async function loadAlternatives() {
  const data = await api.get('/alternatives');

  const list = $('altList');
  list.innerHTML = '';

  data.forEach((a) => {
    const li = document.createElement('li');
    li.className = 'list-item';

    li.innerHTML = `
      <span>${a.name}</span>
      <div>
        <button data-view>👁</button>
        <button data-edit>✏️</button>
        <button data-delete>❌</button>
      </div>
    `;

    li.querySelector('[data-view]').onclick = () =>
      openModal({
        title: a.name,
        contentHTML: `<p>${a.description || 'Немає опису'}</p>`,
      });

    li.querySelector('[data-edit]').onclick = () => editAlternative(a);

    li.querySelector('[data-delete]').onclick = () => deleteAlternative(a._id);

    list.appendChild(li);
  });
}

async function createAlternative() {
  const name = $('altName').value;
  const description = $('altDesc').value;

  if (isEmpty(name) || isEmpty(description)) {
    showToast('Заповніть всі поля');
    return;
  }

  await api.post('/alternatives', { name, description });

  $('altName').value = '';
  $('altDesc').value = '';
  toggleButton();

  showToast('Альтернативу додано', 'success');

  loadAlternatives();
  loadMatrix();
}

function editAlternative(a) {
  openModal({
    title: 'Редагувати альтернативу',
    contentHTML: `
      <input id="modalName" value="${a.name}" placeholder="Назва"/>
      <input id="modalDesc" value="${a.description}" placeholder="Опис"/>
    `,
    onConfirm: async () => {
      const name = $('modalName').value;
      const description = $('modalDesc').value;

      if (isEmpty(name) || isEmpty(description)) {
        showToast('Заповніть всі поля');
        return;
      }

      await api.put(`/alternatives/${a._id}`, { name, description });

      showToast('Оновлено', 'success');
      loadAlternatives();
      loadMatrix();
    },
  });
}

function deleteAlternative(id) {
  openModal({
    title: 'Підтвердження',
    contentHTML: `<p>Видалити альтернативу?</p>`,
    onConfirm: async () => {
      await api.delete(`/alternatives/${id}`);

      showToast('Видалено', 'success');
      loadAlternatives();
      loadMatrix();
    },
  });
}
