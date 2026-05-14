import { api } from './api.js';
import { showToast } from './utils.js';
import {
  setAnalyticsResult,
  showExportButton,
  hideExportButton,
} from './export.js';

const btn = document.getElementById('analyze-btn');
const resultDiv = document.getElementById('analytics-result');

export function checkMatrixFilled(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return false;

  for (const row of matrix) {
    if (!row.criteria) return false;
    const values = Object.values(row.criteria);
    for (const item of values) {
      if (
        item.value === null ||
        item.value === undefined ||
        item.value === '' ||
        isNaN(Number(item.value))
      ) {
        return false;
      }
    }
  }
  return true;
}

export async function updateAnalyticsState(matrix) {
  const alternatives = await api.get('/alternatives');
  const criteria = await api.get('/criteria');

  const hasBasicData =
    alternatives.length > 0 &&
    criteria.length > 0 &&
    Array.isArray(matrix) &&
    matrix.length > 0;

  const isMatrixFilled = checkMatrixFilled(matrix);

  btn.disabled = !(hasBasicData && isMatrixFilled);

  hideExportButton();
  resultDiv.innerHTML = '';
}

btn.addEventListener('click', async () => {
  const alternatives = await api.get('/alternatives');
  const criteria = await api.get('/criteria');
  const matrix = await api.get('/matrix');

  if (!alternatives.length || !criteria.length || !matrix.length) {
    showToast(
      'Немає даних для аналізу. Заповніть альтернативи, критерії та матрицю.',
    );
    return;
  }

  const inputsValid = validateAllMatrixInputs();
  if (!inputsValid) {
    showToast('Заповніть всі поля коректними значеннями (0–10)');
    return;
  }

  if (!checkMatrixFilled(matrix)) {
    showToast('Матриця заповнена не повністю');
    return;
  }

  const data = await api.get('/analyze');

  setAnalyticsResult(data);

  const admissibleSection = renderAdmissibleSection(data);
  const excludedSection = renderExcludedSection(data);
  const ruleLogSection = renderRuleLogSection(data);
  const explanationSection = renderExplanationSection(data);
  const impactSection = renderImpactSection(data);
  const methodComparisonSection = renderMethodComparisonSection(data);
  const sensitivitySection = renderSensitivitySection(data);
  const stabilitySection = renderStabilitySection(data);
  const scenarioSection = renderScenarioSection(data);

  resultDiv.innerHTML = `
    ${explanationSection}
    ${admissibleSection}
    ${excludedSection}
    ${ruleLogSection}
    ${impactSection}
    ${methodComparisonSection}
    ${sensitivitySection}
    ${stabilitySection}
    ${scenarioSection}
    <div class="result-section">
      <h2>Адитивна згортка</h2>
      ${render(data.additive)}
    </div>
    <div class="result-section">
      <h2>Мультиплікативна згортка</h2>
      ${render(data.multiplicative)}
    </div>
    <div class="result-section">
      <h2>Обережна стратегія</h2>
      ${render(data.cautious)}
    </div>
  `;

  showExportButton();
});

// ─── Admissible alternatives summary ──────────────────────────────────────
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatScore(value) {
  return value === null || value === undefined ? '—' : Number(value).toFixed(3);
}

function renderExplanationSection(data) {
  if (!data.explanation) return '';

  const reasons = (data.explanation.reasons || [])
    .map((reason) => `<li>${escapeHtml(reason)}</li>`)
    .join('');
  const appliedRules = [
    ...(data.ruleLog || []),
    ...(data.excluded || []).flatMap((item) =>
      item.source === 'rule'
        ? item.reasons.map((reason) => ({
            alternative: item.alternative,
            detail: reason,
          }))
        : [],
    ),
  ];
  const rulesText = appliedRules.length
    ? appliedRules
        .map(
          (rule) =>
            `<li><strong>${escapeHtml(rule.alternative)}</strong>: ${escapeHtml(rule.detail)}</li>`,
        )
        .join('')
    : '<li>Активні правила не змінили результат.</li>';

  return `
    <div class="result-section analytics-card">
      <h2>Пояснення результату</h2>
      <p class="analytics-summary">${escapeHtml(data.explanation.text)}</p>
      <div class="analytics-grid">
        <div>
          <h3>Основні причини</h3>
          <ul class="analytics-list">${reasons || '<li>Недостатньо даних для деталізації.</li>'}</ul>
        </div>
        <div>
          <h3>Застосовані правила</h3>
          <ul class="analytics-list">${rulesText}</ul>
        </div>
      </div>
    </div>
  `;
}

function renderImpactSection(data) {
  const winner = data.explanation?.winner;
  const impact = (data.influentialCriteria || []).find(
    (item) => item.alternative === winner,
  );

  if (!impact || !impact.criteria.length) return '';

  const rows = impact.criteria
    .map(
      (item) => `
        <tr>
          <td title="${escapeHtml(item.criterion)}">${escapeHtml(item.criterion)}</td>
          <td>${Number(item.weight).toFixed(2)}</td>
          <td>${Number(item.value).toFixed(3)}</td>
          <td>${Number(item.contribution).toFixed(3)}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <div class="result-section">
      <h2>Критерії з найбільшим впливом</h2>
      <div class="table-scroll">
        <table class="result-table">
          <thead><tr><th>Критерій</th><th>Вага</th><th>Значення</th><th>Внесок</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderMethodComparisonSection(data) {
  if (!data.methodComparison || !data.methodComparison.length) return '';

  const rows = data.methodComparison
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td title="${escapeHtml(item.winner)}">${escapeHtml(item.winner || '—')}</td>
          <td>${formatScore(item.score)}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <div class="result-section">
      <h2>Порівняння методів згортки</h2>
      <div class="table-scroll">
        <table class="result-table">
          <thead><tr><th>Метод</th><th>Переможець</th><th>Оцінка</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSensitivitySection(data) {
  if (!data.sensitivity || !data.sensitivity.length) return '';

  const rows = data.sensitivity
    .map(
      (item) => `
        <tr class="${item.changesDecision ? 'warning-row' : ''}">
          <td title="${escapeHtml(item.criterion)}">${escapeHtml(item.criterion)}</td>
          <td>${Number(item.baseWeight).toFixed(2)}</td>
          <td title="${escapeHtml(item.decreasedWinner)}">${escapeHtml(item.decreasedWinner || '—')}</td>
          <td title="${escapeHtml(item.increasedWinner)}">${escapeHtml(item.increasedWinner || '—')}</td>
          <td>${item.changesDecision ? 'Змінюється' : 'Стабільно'}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <div class="result-section">
      <h2>Аналіз чутливості</h2>
      <p class="hint-text">Перевірка показує, чи зміниться переможець SAW, якщо вагу окремого критерію зменшити або збільшити на 20%.</p>
      <div class="table-scroll">
        <table class="result-table">
          <thead><tr><th>Критерій</th><th>Базова вага</th><th>-20%</th><th>+20%</th><th>Висновок</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderStabilitySection(data) {
  if (!data.stability) return '';

  return `
    <div class="result-section analytics-card">
      <h2>Аналіз стабільності рішення</h2>
      <p class="analytics-summary">${escapeHtml(data.stability.summary)}</p>
      <div class="analytics-metrics">
        <span class="metric-pill">Відрив SAW: ${Number(data.stability.margin).toFixed(3)}</span>
        <span class="metric-pill">${data.stability.methodAgreement ? 'Методи узгоджені' : 'Методи дають різних лідерів'}</span>
      </div>
    </div>
  `;
}

function renderScenarioSection(data) {
  if (!data.scenarios || !data.scenarios.length) return '';

  const rows = data.scenarios
    .map(
      (item) => `
        <tr class="${item.changed ? 'warning-row' : ''}">
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.description)}</td>
          <td title="${escapeHtml(item.winner)}">${escapeHtml(item.winner || '—')}</td>
          <td>${formatScore(item.score)}</td>
          <td>${item.changed ? 'Так' : 'Ні'}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <div class="result-section">
      <h2>Сценарний аналіз</h2>
      <div class="table-scroll">
        <table class="result-table">
          <thead><tr><th>Сценарій</th><th>Умови</th><th>Переможець</th><th>Оцінка</th><th>Зміна рішення</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdmissibleSection(data) {
  if (!data.admissible || !data.admissible.length) return '';

  const chips = data.admissible
    .map((a) => `<span class="admissible-chip" title="${a}">${a}</span>`)
    .join('');

  return `
    <div class="result-section">
      <h2>Допустимі альтернативи <span class="count-badge">${data.admissible.length}</span></h2>
      <p class="hint-text">Ці альтернативи пройшли всі порогові обмеження та правила і беруть участь у розрахунку.</p>
      <div class="admissible-chips">${chips}</div>
    </div>
  `;
}

// ─── Excluded alternatives ─────────────────────────────────────────────────
function renderExcludedSection(data) {
  if (!data.excluded || !data.excluded.length) return '';

  const rows = data.excluded
    .map((e) => {
      const icon = e.source === 'threshold' ? '🔒' : '📋';
      const source = e.source === 'threshold' ? 'Поріг' : 'Правило';
      const reasons = e.reasons.map((r) => `<li>${r}</li>`).join('');
      return `
        <tr>
          <td class="alt-cell" title="${e.alternative}">${e.alternative}</td>
          <td><span class="source-badge source-${e.source}">${icon} ${source}</span></td>
          <td class="reasons-cell"><ul class="reasons-list">${reasons}</ul></td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="result-section">
      <h2>Відкинуті альтернативи <span class="count-badge count-badge--red">${data.excluded.length}</span></h2>
      <div class="table-scroll">
        <table class="result-table">
          <thead><tr><th>Альтернатива</th><th>Причина</th><th>Деталі</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ─── Rule adjustments log ──────────────────────────────────────────────────
function renderRuleLogSection(data) {
  if (!data.ruleLog || !data.ruleLog.length) return '';

  const rows = data.ruleLog
    .map(
      (l) => `
      <tr>
        <td class="alt-cell" title="${l.alternative}">${l.alternative}</td>
        <td title="${l.ruleName}">${l.ruleName}</td>
        <td>${l.detail}</td>
      </tr>
    `,
    )
    .join('');

  return `
    <div class="result-section">
      <h2>Корекції оцінок <span class="count-badge">${data.ruleLog.length}</span></h2>
      <div class="table-scroll">
        <table class="result-table">
          <thead><tr><th>Альтернатива</th><th>Правило</th><th>Зміна</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ─── Score table ───────────────────────────────────────────────────────────
function render(arr) {
  if (!arr || !arr.length)
    return '<p class="empty-hint">Немає допустимих альтернатив для оцінювання.</p>';

  const maxScore = Math.max(...arr.map((a) => a.score));

  const rows = arr
    .map((a) => {
      const isBest = a.score === maxScore;
      return `
        <tr class="${isBest ? 'best-row' : ''}">
          <td class="alt-cell" title="${a.alt}">${a.alt}</td>
          <td title="${a.score.toFixed(3)}">${a.score.toFixed(3)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table class="result-table">
      <thead>
        <tr>
          <th>Альтернатива</th>
          <th>Оцінка</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function validateAllMatrixInputs() {
  const inputs = document.querySelectorAll('#matrixTable input');
  let isValid = true;

  inputs.forEach((input) => {
    input.classList.remove('input-error');
    const value = input.value.trim();
    const num = Number(value);
    const isInvalid = value === '' || isNaN(num) || num < 0 || num > 10;
    if (isInvalid) {
      input.classList.add('input-error');
      isValid = false;
    }
  });

  return isValid;
}
