import { api } from './api.js';
import { $, isEmpty, showToast } from './utils.js';
import { openModal } from './modal.js';
import { loadMatrix } from './matrix.js';

export function initCriteria() {
  $('addCritBtn').addEventListener('click', createCriterion);
  $('critName').addEventListener('input', toggleButton);

  toggleButton();
  loadCriteria();
}

function toggleButton() {
  $('addCritBtn').disabled = isEmpty($('critName').value);
}

export async function loadCriteria() {
  const data = await api.get('/criteria');

  const list = $('critList');
  list.innerHTML = '';

  data.forEach((c) => {
    const li = document.createElement('li');
    li.className = 'list-item';

    li.innerHTML = `
      <span>${c.name} (${c.type}) — weight: ${c.weight ?? '—'}</span>
      <div>
        <button data-edit>✏️</button>
        <button data-delete>❌</button>
      </div>
    `;

    li.querySelector('[data-edit]').onclick = () => editCriterion(c);
    li.querySelector('[data-delete]').onclick = () => deleteCriterion(c._id);

    list.appendChild(li);
  });
}

async function createCriterion() {
  const name = $('critName').value;
  const type = $('critType').value;
  const weight = Number($('critWeight').value);

  if (isEmpty(name)) {
    showToast('Введіть назву критерію');
    return;
  }

  if (isNaN(weight) || weight <= 0 || weight >= 10) {
    showToast('Введіть коректну вагу (0–10)');
    return;
  }

  await api.post('/criteria', { name, type, weight });

  $('critName').value = '';
  $('critWeight').value = '';
  toggleButton();

  showToast('Критерій додано', 'success');

  loadCriteria();
  loadMatrix();
}

function editCriterion(c) {
  openModal({
    title: 'Редагувати критерій',
    contentHTML: `
      <input id="modalName" value="${c.name}" placeholder="Назва"/>

      <select id="modalType">
        <option value="maximize" ${c.type === 'maximize' ? 'selected' : ''}>Max</option>
        <option value="minimize" ${c.type === 'minimize' ? 'selected' : ''}>Min</option>
      </select>

      <input id="modalWeight" type="number" value="${c.weight ?? ''}" placeholder="Вага (0-10)" step="0.1"/>
    `,
    onConfirm: async () => {
      const name = $('modalName').value;
      const type = $('modalType').value;
      const weight = Number($('modalWeight').value);

      if (isEmpty(name)) {
        showToast('Введіть назву');
        return;
      }

      if (isNaN(weight) || weight <= 0 || weight >= 10) {
        showToast('Некоректна вага');
        return;
      }

      await api.put(`/criteria/${c._id}`, { name, type, weight });

      showToast('Оновлено', 'success');
      loadCriteria();
      loadMatrix();
    },
  });
}

function deleteCriterion(id) {
  openModal({
    title: 'Підтвердження',
    contentHTML: `<p>Видалити критерій?</p>`,
    onConfirm: async () => {
      await api.delete(`/criteria/${id}`);

      showToast('Видалено', 'success');
      loadCriteria();
      loadMatrix();
    },
  });
}
