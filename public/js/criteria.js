import { api } from './api.js';
import { $, isEmpty, showToast } from './utils.js';
import { openModal } from './modal.js';
import { loadMatrix } from './matrix.js';

export function initCriteria() {
  $('addCritBtn').addEventListener('click', createCriterion);
  $('critName').addEventListener('input', toggleButton);

  $('critThresholdEnabled').addEventListener('change', () => {
    $('thresholdFields').classList.toggle(
      'hidden',
      !$('critThresholdEnabled').checked,
    );
  });

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

    const typeLabel = c.type === 'maximize' ? '↑ max' : '↓ min';
    const fullTitle = `${c.name} · ${typeLabel} · вага: ${c.weight ?? '—'}`;

    let thresholdBadge = '';
    if (c.thresholdEnabled) {
      const parts = [];
      if (c.thresholdMin !== null && c.thresholdMin !== undefined)
        parts.push(`≥${c.thresholdMin}`);
      if (c.thresholdMax !== null && c.thresholdMax !== undefined)
        parts.push(`≤${c.thresholdMax}`);
      thresholdBadge = `<span class="threshold-badge" title="Поріг активний">🔒 ${parts.join(' ')}</span>`;
    }

    li.innerHTML = `
      <div class="item-text">
        <span class="item-name" title="${fullTitle.replace(/"/g, '&quot;')}">${c.name}</span>
        <span class="item-desc">${typeLabel} · вага: ${c.weight ?? '—'} ${thresholdBadge}</span>
      </div>
      <div class="item-actions">
        <button class="btn-icon" data-edit title="Редагувати">✏️</button>
        <button class="btn-icon btn-danger" data-delete title="Видалити">❌</button>
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

  const thresholdEnabled = $('critThresholdEnabled').checked;
  const thresholdMin =
    thresholdEnabled && $('critThresholdMin').value !== ''
      ? Number($('critThresholdMin').value)
      : null;
  const thresholdMax =
    thresholdEnabled && $('critThresholdMax').value !== ''
      ? Number($('critThresholdMax').value)
      : null;

  await api.post('/criteria', {
    name,
    type,
    weight,
    thresholdEnabled,
    thresholdMin,
    thresholdMax,
  });

  $('critName').value = '';
  $('critWeight').value = '';
  $('critThresholdEnabled').checked = false;
  $('critThresholdMin').value = '';
  $('critThresholdMax').value = '';
  $('thresholdFields').classList.add('hidden');
  toggleButton();

  showToast('Критерій додано', 'success');
  loadCriteria();
  loadMatrix();
}

function editCriterion(c) {
  const thresholdChecked = c.thresholdEnabled ? 'checked' : '';
  const minVal = c.thresholdMin ?? '';
  const maxVal = c.thresholdMax ?? '';

  openModal({
    title: 'Редагувати критерій',
    contentHTML: `
      <input id="modalName" value="${c.name}" placeholder="Назва"/>

      <select id="modalType">
        <option value="maximize" ${c.type === 'maximize' ? 'selected' : ''}>↑ Max</option>
        <option value="minimize" ${c.type === 'minimize' ? 'selected' : ''}>↓ Min</option>
      </select>

      <input id="modalWeight" type="number" value="${c.weight ?? ''}" placeholder="Вага (0-10)" step="0.1"/>

      <div class="threshold-row">
        <label class="threshold-toggle-label">
          <input type="checkbox" id="modalThresholdEnabled" ${thresholdChecked} onchange="document.getElementById('modalThresholdFields').classList.toggle('hidden',!this.checked)"/>
          <span>Порогові значення</span>
        </label>
        <div id="modalThresholdFields" class="threshold-fields ${c.thresholdEnabled ? '' : 'hidden'}">
          <input id="modalThresholdMin" type="number" placeholder="Мін." step="0.1" min="0" max="10" value="${minVal}" class="threshold-input"/>
          <span class="threshold-sep">—</span>
          <input id="modalThresholdMax" type="number" placeholder="Макс." step="0.1" min="0" max="10" value="${maxVal}" class="threshold-input"/>
        </div>
      </div>
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

      const thresholdEnabled = $('modalThresholdEnabled').checked;
      const thresholdMin =
        thresholdEnabled && $('modalThresholdMin').value !== ''
          ? Number($('modalThresholdMin').value)
          : null;
      const thresholdMax =
        thresholdEnabled && $('modalThresholdMax').value !== ''
          ? Number($('modalThresholdMax').value)
          : null;

      await api.put(`/criteria/${c._id}`, {
        name,
        type,
        weight,
        thresholdEnabled,
        thresholdMin,
        thresholdMax,
      });

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
