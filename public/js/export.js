/**
 * Формат CSV:
 *
 *   # Система підтримки рішень — експорт даних
 *   # Дата: (дата та час експорту)
 *
 *   [ALTERNATIVES]
 *   id,name,description
 *
 *   [CRITERIA]
 *   id,name,type,weight
 *
 *   [MATRIX]
 *   alternative_id,criterion_id,value
 *
 *   [RESULTS]
 *   method,alternative_id,alternative_name,score,rank
 */

import { api } from './api.js';
import { showToast } from './utils.js';

let lastAnalyticsResult = null;

export function setAnalyticsResult(result) {
  lastAnalyticsResult = result;
}

export function showExportButton() {
  const wrap = document.getElementById('exportBtns');
  if (wrap) wrap.classList.remove('hidden');
}

export function hideExportButton() {
  const wrap = document.getElementById('exportBtns');
  if (wrap) wrap.classList.add('hidden');
  lastAnalyticsResult = null;
}

export function initExport() {
  const jsonBtn = document.getElementById('exportBtn');
  const csvBtn = document.getElementById('exportCsvBtn');

  if (jsonBtn)
    jsonBtn.addEventListener('click', () => runExport('json', jsonBtn));
  if (csvBtn) csvBtn.addEventListener('click', () => runExport('csv', csvBtn));
}

async function runExport(format, btn) {
  const originalText = btn.textContent;

  try {
    btn.disabled = true;
    btn.textContent = 'Збираю дані...';

    const [alternatives, criteria, matrix] = await Promise.all([
      api.get('/alternatives'),
      api.get('/criteria'),
      api.get('/matrix'),
    ]);

    const date = formatDate(new Date());

    if (format === 'json') {
      const data = buildJson(alternatives, criteria, matrix);
      downloadFile(
        JSON.stringify(data, null, 2),
        `dss-export-${date}.json`,
        'application/json',
      );
    } else {
      const csv = buildCsv(alternatives, criteria, matrix);
      downloadFile(
        '\uFEFF' + csv,
        `dss-export-${date}.csv`,
        'text/csv;charset=utf-8;',
      );
    }

    showToast('Дані успішно експортовано', 'success');
  } catch {
    showToast('Помилка при експорті даних');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function buildCsv(alternatives, criteria, matrix) {
  const lines = [];
  const date = new Date().toLocaleString('uk-UA');

  const altIdMap = new Map();
  alternatives.forEach((a, i) => altIdMap.set(String(a._id), `A${i + 1}`));

  const critIdMap = new Map();
  criteria.forEach((c, i) => critIdMap.set(String(c._id), `C${i + 1}`));

  lines.push(`# Система підтримки рішень — експорт даних`);
  lines.push(`# Дата: ${date}`);
  lines.push(`# Для імпорту завантажте цей файл через кнопку "Вибрати CSV"`);
  lines.push('');

  lines.push('[ALTERNATIVES]');
  lines.push('id;name;description');
  alternatives.forEach((a) => {
    const localId = altIdMap.get(String(a._id));
    lines.push([localId, q(a.name), q(a.description || '')].join(';'));
  });
  lines.push('');

  lines.push('[CRITERIA]');
  lines.push('id;name;type;weight');
  criteria.forEach((c) => {
    const localId = critIdMap.get(String(c._id));
    lines.push([localId, q(c.name), c.type, c.weight].join(';'));
  });
  lines.push('');

  lines.push('[MATRIX]');
  lines.push('alternative_id;criterion_id;value');

  matrix.forEach((row) => {
    const altLocalId = altIdMap.get(String(row.alternative_id));
    Object.entries(row.criteria).forEach(([critMongoId, cell]) => {
      const critLocalId = critIdMap.get(critMongoId);
      if (
        altLocalId &&
        critLocalId &&
        cell.value !== null &&
        cell.value !== undefined
      ) {
        lines.push([altLocalId, critLocalId, cell.value].join(';'));
      }
    });
  });
  lines.push('');

  lines.push('[RESULTS]');
  lines.push('method;alternative_id;alternative_name;score;rank');

  if (lastAnalyticsResult) {
    const methods = [
      { key: 'additive', label: 'SAW' },
      { key: 'multiplicative', label: 'MUL' },
      { key: 'cautious', label: 'MINIMAX' },
    ];

    methods.forEach(({ key, label }) => {
      const arr = [...(lastAnalyticsResult[key] || [])];

      arr.sort((a, b) => b.score - a.score);

      arr.forEach((r, idx) => {
        const alt = alternatives.find((a) => a.name === r.alt);
        const localId = alt ? altIdMap.get(String(alt._id)) : '?';

        lines.push(
          [label, localId, q(r.alt), r.score.toFixed(4), idx + 1].join(';'),
        );
      });
    });
  } else {
    lines.push('# Результати відсутні — виконайте аналіз перед експортом');
  }

  return lines.join('\r\n');
}

function buildJson(alternatives, criteria, matrix) {
  const altIdMap = new Map();
  alternatives.forEach((a, i) => altIdMap.set(String(a._id), `A${i + 1}`));

  const critIdMap = new Map();
  criteria.forEach((c, i) => critIdMap.set(String(c._id), `C${i + 1}`));

  return {
    exportedAt: new Date().toISOString(),
    alternatives: alternatives.map((a) => ({
      id: altIdMap.get(String(a._id)),
      name: a.name,
      description: a.description,
    })),
    criteria: criteria.map((c) => ({
      id: critIdMap.get(String(c._id)),
      name: c.name,
      type: c.type,
      weight: c.weight,
    })),
    matrix: matrix.flatMap((row) =>
      Object.entries(row.criteria)
        .filter(([, cell]) => cell.value !== null && cell.value !== undefined)
        .map(([critMongoId, cell]) => ({
          alternative_id: altIdMap.get(String(row.alternative_id)),
          criterion_id: critIdMap.get(critMongoId),
          value: cell.value,
        })),
    ),
    results: lastAnalyticsResult
      ? ['additive', 'multiplicative', 'cautious'].flatMap((key) => {
          const labels = {
            additive: 'SAW',
            multiplicative: 'MUL',
            cautious: 'MINIMAX',
          };
          return [...(lastAnalyticsResult[key] || [])]
            .sort((a, b) => b.score - a.score)
            .map((r, idx) => {
              const alt = alternatives.find((a) => a.name === r.alt);
              return {
                method: labels[key],
                alternative_id: alt ? altIdMap.get(String(alt._id)) : '?',
                alternative_name: r.alt,
                score: r.score,
                rank: idx + 1,
              };
            });
        })
      : null,
  };
}

function q(value) {
  const str = String(value ?? '');
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}
