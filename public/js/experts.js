import { api } from './api.js';
import { $, isEmpty, showToast } from './utils.js';
import { openModal } from './modal.js';

let selectedExpertId = null;
let currentAlternatives = [];
let currentCriteria = [];

export function initExperts() {
  $('addExpertBtn').addEventListener('click', createExpert);
  $('expertName').addEventListener('input', toggleAddBtn);
  $('expertDesc').addEventListener('input', toggleAddBtn);
  $('saveRatingsBtn').addEventListener('click', saveRatings);

  toggleAddBtn();
  loadExperts();
}

function toggleAddBtn() {
  $('addExpertBtn').disabled = isEmpty($('expertName').value);
}

export async function loadExperts() {
  const experts = await api.get('/experts');
  const list = $('expertList');
  list.innerHTML = '';

  if (!experts.length) {
    list.innerHTML = '<li class="empty-hint">Ще немає експертів</li>';
    return;
  }

  experts.forEach((e) => {
    const li = document.createElement('li');
    li.className =
      'list-item expert-item' + (e._id === selectedExpertId ? ' selected' : '');
    li.dataset.id = e._id;

    li.innerHTML = `
      <div class="item-text expert-info" data-select="${e._id}">
        <span class="item-name expert-name" title="${e.name}">${e.name}</span>
        ${e.description ? `<span class="item-desc expert-desc" title="${e.description}">${e.description}</span>` : ''}
      </div>
      <div class="item-actions">
        <button class="btn-icon" data-edit title="Редагувати">✏️</button>
        <button class="btn-icon btn-danger" data-delete title="Видалити">❌</button>
      </div>
    `;

    li.querySelector('[data-select]').onclick = () => selectExpert(e);
    li.querySelector('[data-edit]').onclick = () => editExpert(e);
    li.querySelector('[data-delete]').onclick = () => deleteExpert(e._id);

    list.appendChild(li);
  });
}

async function selectExpert(expert) {
  selectedExpertId = expert._id;

  document.querySelectorAll('.expert-item').forEach((li) => {
    li.classList.toggle('selected', li.dataset.id === expert._id);
  });

  const [alternatives, criteria, ratings] = await Promise.all([
    api.get('/alternatives'),
    api.get('/criteria'),
    api.get(`/expert-ratings/expert/${expert._id}`),
  ]);

  currentAlternatives = alternatives;
  currentCriteria = criteria;

  if (!alternatives.length || !criteria.length) {
    showToast(
      'Спочатку додайте альтернативи та критерії на вкладці «Модель»',
      'error',
    );
    return;
  }

  const ratingMap = {};
  for (const r of ratings) {
    if (!r.alternative_id || !r.criterion_id) continue;
    const altId = r.alternative_id._id ?? r.alternative_id;
    const critId = r.criterion_id._id ?? r.criterion_id;
    ratingMap[`${altId}_${critId}`] = r.value;
  }

  renderRatingTable(expert, alternatives, criteria, ratingMap);
}

function renderRatingTable(expert, alternatives, criteria, ratingMap) {
  $('ratingsPlaceholder').classList.add('hidden');
  $('expertRatingsContent').classList.remove('hidden');
  $('ratingExpertName').textContent = `Оцінки: ${expert.name}`;

  const table = $('expertRatingTable');
  table.innerHTML = '';

  // Header
  const thead = document.createElement('thead');
  let headerRow = '<tr><th>Альтернатива</th>';
  criteria.forEach((c) => {
    headerRow += `<th title="${c.name}">${c.name}<br><small>${c.type === 'maximize' ? '↑ max' : '↓ min'}</small></th>`;
  });
  headerRow += '</tr>';
  thead.innerHTML = headerRow;
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  alternatives.forEach((alt) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="alt-cell" title="${alt.name}">${alt.name}</td>`;

    criteria.forEach((crit) => {
      const td = document.createElement('td');
      const key = `${alt._id}_${crit._id}`;
      const existingValue = ratingMap[key] ?? '';

      const input = document.createElement('input');
      input.type = 'number';
      input.min = 0;
      input.max = 10;
      input.step = 1;
      input.placeholder = '0–10';
      input.value = existingValue;
      input.dataset.altId = alt._id;
      input.dataset.critId = crit._id;

      input.addEventListener('input', () => {
        const v = Number(input.value);
        const invalid = input.value === '' || isNaN(v) || v < 0 || v > 10;
        input.classList.toggle('input-error', invalid);
      });

      td.appendChild(input);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

async function saveRatings() {
  if (!selectedExpertId) return;

  const inputs = $('expertRatingTable').querySelectorAll('input');
  const ratings = [];
  let hasError = false;

  inputs.forEach((input) => {
    const v = Number(input.value);
    if (input.value === '' || isNaN(v) || v < 0 || v > 10) {
      input.classList.add('input-error');
      hasError = true;
    } else {
      input.classList.remove('input-error');
      ratings.push({
        alternative_id: input.dataset.altId,
        criterion_id: input.dataset.critId,
        value: v,
      });
    }
  });

  if (hasError) {
    showToast('Виправте помилки у оцінках (0–10)', 'error');
    return;
  }

  if (!ratings.length) {
    showToast('Немає оцінок для збереження', 'error');
    return;
  }

  await api.post('/expert-ratings/bulk', {
    expert_id: selectedExpertId,
    ratings,
  });

  showToast('Оцінки збережено', 'success');
}

async function createExpert() {
  const name = $('expertName').value.trim();
  const description = $('expertDesc').value.trim();

  if (isEmpty(name)) {
    showToast("Введіть ім'я експерта");
    return;
  }

  await api.post('/experts', { name, description });

  $('expertName').value = '';
  $('expertDesc').value = '';
  toggleAddBtn();

  showToast('Експерта додано', 'success');
  loadExperts();
}

function editExpert(e) {
  openModal({
    title: 'Редагувати експерта',
    contentHTML: `
      <input id="modalName" value="${e.name}" placeholder="ПІБ або ім'я" />
      <input id="modalDesc" value="${e.description || ''}" placeholder="Посада / коментар" />
    `,
    onConfirm: async () => {
      const name = $('modalName').value.trim();
      if (isEmpty(name)) {
        showToast("Введіть ім'я");
        return;
      }
      await api.put(`/experts/${e._id}`, {
        name,
        description: $('modalDesc').value.trim(),
      });
      showToast('Оновлено', 'success');
      loadExperts();
    },
  });
}

function deleteExpert(id) {
  openModal({
    title: 'Підтвердження',
    contentHTML: '<p>Видалити експерта та всі його оцінки?</p>',
    onConfirm: async () => {
      await api.delete(`/experts/${id}`);
      if (selectedExpertId === id) {
        selectedExpertId = null;
        $('ratingsPlaceholder').classList.remove('hidden');
        $('expertRatingsContent').classList.add('hidden');
      }
      showToast('Видалено', 'success');
      loadExperts();
    },
  });
}
