const API = 'http://localhost:3000';

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  document
    .getElementById('addAltBtn')
    .addEventListener('click', createAlternative);

  document
    .getElementById('addCritBtn')
    .addEventListener('click', createCriterion);

  loadAlternatives();
  loadCriteria();
  loadMatrix();
});

// ================= АЛЬТЕРНАТИВИ =================
async function loadAlternatives() {
  const res = await fetch(`${API}/alternatives`);
  const data = await res.json();

  const list = document.getElementById('altList');
  list.innerHTML = '';

  data.forEach((a) => {
    const li = document.createElement('li');
    li.className = 'list-item';

    const name = document.createElement('span');
    name.textContent = a.name;

    const actions = document.createElement('div');

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () =>
      editAlternative(a._id, a.name, a.description),
    );

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.addEventListener('click', () => deleteAlternative(a._id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(name);
    li.appendChild(actions);

    list.appendChild(li);
  });
}

async function createAlternative() {
  const name = document.getElementById('altName').value;
  const description = document.getElementById('altDesc').value;

  await fetch(`${API}/alternatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });

  document.getElementById('altName').value = '';
  document.getElementById('altDesc').value = '';

  loadAlternatives();
  loadMatrix();
}

async function editAlternative(id, oldName, oldDesc) {
  const name = prompt('Нова назва:', oldName);
  const description = prompt('Новий опис:', oldDesc);

  if (!name) return;

  await fetch(`${API}/alternatives/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });

  loadAlternatives();
  loadMatrix();
}

async function deleteAlternative(id) {
  await fetch(`${API}/alternatives/${id}`, { method: 'DELETE' });

  loadAlternatives();
  loadMatrix();
}

// ================= КРИТЕРІЇ =================
async function loadCriteria() {
  const res = await fetch(`${API}/criteria`);
  const data = await res.json();

  const list = document.getElementById('critList');
  list.innerHTML = '';

  data.forEach((c) => {
    const li = document.createElement('li');
    li.className = 'list-item';

    const name = document.createElement('span');
    name.textContent = `${c.name} (${c.type})`;

    const actions = document.createElement('div');

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () =>
      editCriterion(c._id, c.name, c.type),
    );

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.addEventListener('click', () => deleteCriterion(c._id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(name);
    li.appendChild(actions);

    list.appendChild(li);
  });
}

async function createCriterion() {
  const name = document.getElementById('critName').value;
  const type = document.getElementById('critType').value;

  await fetch(`${API}/criteria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type }),
  });

  document.getElementById('critName').value = '';

  loadCriteria();
  loadMatrix();
}

async function editCriterion(id, oldName, oldType) {
  const name = prompt('Нова назва:', oldName);
  const type = prompt('Тип (maximize/minimize):', oldType);

  if (!name || !type) return;

  await fetch(`${API}/criteria/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type }),
  });

  loadCriteria();
  loadMatrix();
}

async function deleteCriterion(id) {
  await fetch(`${API}/criteria/${id}`, { method: 'DELETE' });

  loadCriteria();
  loadMatrix();
}

// ================= МАТРИЦЯ =================
async function loadMatrix() {
  const res = await fetch(`${API}/matrix`);
  const data = await res.json();

  const table = document.getElementById('matrixTable');
  table.innerHTML = '';

  if (!data.length) return;

  // ===== HEADER =====
  const headerRow = document.createElement('tr');

  const firstTh = document.createElement('th');
  firstTh.textContent = 'Альтернатива';
  headerRow.appendChild(firstTh);

  const criteriaIds = Object.keys(data[0].criteria);

  criteriaIds.forEach((critId) => {
    const th = document.createElement('th');
    th.textContent = data[0].criteria[critId].name;
    headerRow.appendChild(th);
  });

  table.appendChild(headerRow);

  // ===== ROWS =====
  data.forEach((row) => {
    const tr = document.createElement('tr');

    const altTd = document.createElement('td');
    altTd.textContent = row.alternative;
    tr.appendChild(altTd);

    criteriaIds.forEach((critId) => {
      const td = document.createElement('td');

      const input = document.createElement('input');
      input.type = 'number';
      input.value = row.criteria[critId].value ?? '';

      input.addEventListener('change', async () => {
        const value = Number(input.value);

        await saveEvaluation(row.alternative_id, critId, value);
      });

      td.appendChild(input);
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });
}

async function saveEvaluation(alternative_id, criterion_id, value) {
  await fetch(`${API}/evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alternative_id,
      criterion_id,
      value,
    }),
  });
}
