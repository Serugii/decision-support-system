import { api } from './api.js';
import { $, showToast } from './utils.js';
import { updateAnalyticsState } from './analytics.js';

export async function loadMatrix() {
  const data = await api.get('/matrix');

  const table = $('matrixTable');
  table.innerHTML = '';

  if (!data?.length) return;

  const criteriaIds = Object.keys(data[0].criteria);

  // header
  const header = document.createElement('tr');
  header.innerHTML = `<th>Альтернатива</th>`;
  criteriaIds.forEach((id) => {
    header.innerHTML += `<th>${data[0].criteria[id].name}</th>`;
  });
  table.appendChild(header);

  // rows
  data.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.alternative}</td>`;

    criteriaIds.forEach((critId) => {
      const td = document.createElement('td');
      const input = document.createElement('input');

      input.type = 'number';
      input.min = 0;
      input.max = 10;
      input.step = 1;
      input.placeholder = '0-10';
      input.value = row.criteria[critId].value ?? '';

      input.addEventListener('change', async () => {
        const value = input.value.trim();
        const num = Number(value);

        if (value === '' || isNaN(num) || num < 0 || num > 10) {
          input.style.border = '1px solid red';
          showToast('Некоректне значення (введіть число від 0 до 10)');
          return;
        }

        input.style.border = '1px solid #ccc';

        await api.post('/evaluations', {
          alternative_id: row.alternative_id,
          criterion_id: critId,
          value: num,
        });

        const updatedMatrix = await api.get('/matrix');
        updateAnalyticsState(updatedMatrix);
      });

      input.addEventListener('input', () => {
        const value = input.value.trim();
        const num = Number(value);

        const isInvalid = value === '' || isNaN(num) || num < 0 || num > 10;

        if (isInvalid) {
          input.classList.add('input-error');
        } else {
          input.classList.remove('input-error');
        }
      });

      td.appendChild(input);
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });
  return data;
}
