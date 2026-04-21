/**
 * Формат файлу (секційний CSV):
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
 * Правила:
 *  - Рядки, що починаються з # — коментарі, ігноруються
 *  - Порожні рядки між секціями — ігноруються
 *  - Розділювач: кома або крапка з комою (визначається автоматично)
 *  - Секція [RESULTS] при імпорті ігнорується
 *  - BOM (UTF-8 з BOM) прибирається автоматично
 */

import { api } from './api.js';
import { showToast } from './utils.js';
import { loadAlternatives } from './alternatives.js';
import { loadCriteria } from './criteria.js';
import { loadMatrix } from './matrix.js';
import { updateAnalyticsState } from './analytics.js';

function detectSeparator(lines) {
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('[') || t.startsWith('#')) continue;
    return t.includes(';') ? ';' : ',';
  }
  return ',';
}

function parseLine(line, sep) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseSections(text, sep) {
  const sections = new Map();
  let currentSection = null;

  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const sectionMatch = line.match(/^\[([A-Z_]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      sections.set(currentSection, []);
      continue;
    }

    if (currentSection) {
      sections.get(currentSection).push(parseLine(line, sep));
    }
  }

  return sections;
}

export function parseCsv(text) {
  const sep = detectSeparator(text.split(/\r?\n/));
  const sections = parseSections(text, sep);

  const altRows = sections.get('ALTERNATIVES') || [];
  const altData = altRows.slice(1);

  if (altData.length === 0) {
    throw new Error('Секція [ALTERNATIVES] порожня або відсутня');
  }

  const altByLocalId = new Map();
  const alternatives = [];

  for (const cells of altData) {
    const [localId, name, description] = cells;
    if (!localId || !name) continue;
    const alt = { name, description: description || name };
    alternatives.push(alt);
    altByLocalId.set(localId.trim(), alternatives.length - 1);
  }

  const critRows = sections.get('CRITERIA') || [];
  const critData = critRows.slice(1);

  if (critData.length === 0) {
    throw new Error('Секція [CRITERIA] порожня або відсутня');
  }

  const critByLocalId = new Map();
  const criteria = [];

  for (const cells of critData) {
    const [localId, name, typeRaw, weightStr] = cells;
    if (!localId || !name) continue;

    const type = (typeRaw || '').toLowerCase();
    if (type !== 'maximize' && type !== 'minimize') {
      throw new Error(
        `Невідомий тип критерію "${typeRaw}" для "${name}". Допустимі: maximize, minimize`,
      );
    }

    const weight = parseFloat(weightStr);
    if (isNaN(weight) || weight <= 0 || weight > 10) {
      throw new Error(
        `Некоректна вага "${weightStr}" для критерію "${name}". Має бути число від 0 до 10`,
      );
    }

    criteria.push({ name, type, weight });
    critByLocalId.set(localId.trim(), criteria.length - 1);
  }

  const matrixRows = sections.get('MATRIX') || [];
  const matrixData = matrixRows.slice(1);

  const evaluations = [];

  for (const cells of matrixData) {
    const [altLocalId, critLocalId, valueStr] = cells;
    if (!altLocalId || !critLocalId) continue;

    const altIndex = altByLocalId.get(altLocalId.trim());
    const critIndex = critByLocalId.get(critLocalId.trim());

    if (altIndex === undefined) {
      throw new Error(
        `У [MATRIX] знайдено невідомий id альтернативи: "${altLocalId}"`,
      );
    }
    if (critIndex === undefined) {
      throw new Error(
        `У [MATRIX] знайдено невідомий id критерію: "${critLocalId}"`,
      );
    }

    const value = parseFloat(valueStr);
    if (!isNaN(value)) {
      evaluations.push({
        alternativeIndex: altIndex,
        criterionIndex: critIndex,
        value,
      });
    }
  }

  return { alternatives, criteria, evaluations };
}

export function initCsvImport() {
  const fileInput = document.getElementById('csvInput');
  const importBtn = document.getElementById('importCsvBtn');

  if (!fileInput || !importBtn) return;

  fileInput.addEventListener('change', () => {
    importBtn.disabled = !fileInput.files?.length;
  });

  importBtn.addEventListener('click', async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      showToast('Виберіть CSV-файл');
      return;
    }

    importBtn.disabled = true;
    importBtn.textContent = 'Імпортується...';

    try {
      const text = await file.text();
      const { alternatives, criteria, evaluations } = parseCsv(text);

      await api.post('/import/csv', { alternatives, criteria, evaluations });

      showToast(
        `Імпортовано: ${alternatives.length} альт., ${criteria.length} крит., ${evaluations.length} оцінок`,
        'success',
      );

      fileInput.value = '';
      importBtn.disabled = true;

      await loadAlternatives();
      await loadCriteria();
      const matrix = await loadMatrix();
      updateAnalyticsState(matrix);
    } catch (err) {
      showToast(err.message || 'Помилка імпорту');
    } finally {
      importBtn.textContent = 'Імпортувати';
      importBtn.disabled = !fileInput.files?.length;
    }
  });
}
