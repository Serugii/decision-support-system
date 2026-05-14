import { api } from './api.js';
import { $, showToast } from './utils.js';
import { openModal } from './modal.js';
import { onTabChange } from './tabs.js';

const OPERATOR_LABELS = { gt: '>', lt: '<', gte: '≥', lte: '≤', eq: '=' };
const ACTION_LABELS = {
  exclude: 'відкинути альтернативу',
  adjust: 'скоригувати оцінку',
};

export function initRules() {
  $('ruleAction').addEventListener('change', (e) => {
    const isAdjust = e.target.value === 'adjust';
    $('ruleAdjustWrap').classList.toggle('hidden', !isAdjust);
    $('ruleActionValue').disabled = !isAdjust;
    updateAddBtn();
  });

  $('ruleActionValue').disabled = true;

  $('addRuleBtn').addEventListener('click', createRule);

  ['ruleName', 'ruleCriterion', 'ruleValue', 'ruleActionValue'].forEach((id) =>
    $(id).addEventListener('input', updateAddBtn),
  );
  $('ruleCriterion').addEventListener('change', updateAddBtn);

  updateAddBtn();
  loadCriteriaOptions();
  loadRules();

  onTabChange('rules', () => {
    loadCriteriaOptions();
    loadRules();
  });
}

function updateAddBtn() {
  const nameOk = $('ruleName').value.trim() !== '';
  const critOk = $('ruleCriterion').value !== '';
  const valOk = $('ruleValue').value.trim() !== '';
  const action = $('ruleAction').value;
  const adjOk = action !== 'adjust' || $('ruleActionValue').value.trim() !== '';
  $('addRuleBtn').disabled = !(nameOk && critOk && valOk && adjOk);
}

async function loadCriteriaOptions() {
  const criteria = await api.get('/criteria');
  const sel = $('ruleCriterion');
  const currentVal = sel.value;
  sel.innerHTML = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '— оберіть критерій —';
  sel.appendChild(defaultOpt);
  criteria.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c._id;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
  if (currentVal && [...sel.options].some((o) => o.value === currentVal)) {
    sel.value = currentVal;
  }
}

export async function loadRules() {
  const rules = await api.get('/rules');
  const list = $('ruleList');
  list.innerHTML = '';

  if (!rules.length) {
    list.innerHTML = '<li class="empty-hint">Ще немає правил</li>';
    return;
  }

  rules.forEach((r) => {
    const li = document.createElement('li');
    li.className = 'rule-item' + (r.enabled ? '' : ' rule-disabled');
    const critName = r.criterion_id?.name ?? '⚠ критерій видалено';
    const opLabel = OPERATOR_LABELS[r.operator] ?? r.operator;
    const actLabel = ACTION_LABELS[r.action] ?? r.action;
    const adjDetail =
      r.action === 'adjust'
        ? ` <span class="rule-detail">(${r.actionValue > 0 ? '+' : ''}${r.actionValue}%)</span>`
        : '';

    const fullNameTitle = r.name.replace(/"/g, '&quot;');
    const fullLogicTitle = `IF ${critName} ${opLabel} ${r.value} THEN ${actLabel}${r.action === 'adjust' ? ` ${r.actionValue > 0 ? '+' : ''}${r.actionValue}%` : ''}`;

    li.innerHTML = `
      <div class="rule-item-body">
        <div class="rule-item-name" title="${fullNameTitle}">${r.name}</div>
        <div class="rule-item-logic">
          <span class="rule-chip rule-if">IF</span>
          <span class="rule-chip-text" title="${critName}">${critName}</span>
          <span class="rule-chip rule-op">${opLabel}</span>
          <span class="rule-chip-text" title="${r.value}">${r.value}</span>
          <span class="rule-chip rule-then">THEN</span>
          <span class="rule-chip-text" title="${fullLogicTitle}">${actLabel}${adjDetail}</span>
        </div>
      </div>
      <div class="rule-item-actions">
        <button class="rule-toggle btn-icon" title="${r.enabled ? 'Вимкнути' : 'Увімкнути'}">${r.enabled ? '✅' : '⬜'}</button>
        <button class="btn-icon" data-edit title="Редагувати">✏️</button>
        <button class="btn-icon btn-danger" data-delete title="Видалити">❌</button>
      </div>
    `;

    li.querySelector('.rule-toggle').onclick = () => toggleRule(r);
    li.querySelector('[data-edit]').onclick = () => editRule(r);
    li.querySelector('[data-delete]').onclick = () => deleteRule(r._id);

    list.appendChild(li);
  });
}

async function createRule() {
  const name = $('ruleName').value.trim();
  const criterion_id = $('ruleCriterion').value;
  const operator = $('ruleOperator').value;
  const value = Number($('ruleValue').value);
  const action = $('ruleAction').value;
  const actionValue =
    action === 'adjust' ? Number($('ruleActionValue').value) : 0;

  if (!name || !criterion_id || isNaN(value)) {
    showToast('Заповніть всі поля правила');
    return;
  }

  await api.post('/rules', {
    name,
    criterion_id,
    operator,
    value,
    action,
    actionValue,
    enabled: true,
  });

  $('ruleName').value = '';
  $('ruleCriterion').value = '';
  $('ruleValue').value = '';
  $('ruleActionValue').value = '';
  $('ruleAction').value = 'exclude';
  $('ruleAdjustWrap').classList.add('hidden');
  $('ruleActionValue').disabled = true;
  updateAddBtn();

  showToast('Правило додано', 'success');
  loadRules();
}

async function toggleRule(r) {
  const critId = r.criterion_id?._id ?? r.criterion_id;
  await api.put(`/rules/${r._id}`, {
    ...r,
    enabled: !r.enabled,
    criterion_id: critId,
  });
  loadRules();
}

function editRule(r) {
  const critId = r.criterion_id?._id ?? r.criterion_id ?? '';

  openModal({
    title: 'Редагувати правило',
    contentHTML: `
      <input id="modalRuleName" value="${r.name}" placeholder="Назва правила"/>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span class="rule-keyword rule-if" style="margin:0">IF</span>
        <select id="modalRuleCrit" class="rule-select" style="flex:1"></select>
        <select id="modalRuleOp" class="rule-select rule-select-sm">
          <option value="gt" ${r.operator === 'gt' ? 'selected' : ''}>></option>
          <option value="lt" ${r.operator === 'lt' ? 'selected' : ''}>&lt;</option>
          <option value="gte" ${r.operator === 'gte' ? 'selected' : ''}>≥</option>
          <option value="lte" ${r.operator === 'lte' ? 'selected' : ''}>≤</option>
          <option value="eq" ${r.operator === 'eq' ? 'selected' : ''}>=</option>
        </select>
        <input id="modalRuleVal" type="number" value="${r.value}" step="0.1" min="0" max="10" class="rule-val-input"/>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span class="rule-keyword rule-then" style="margin:0">THEN</span>
        <select id="modalRuleAction" class="rule-select">
          <option value="exclude" ${r.action === 'exclude' ? 'selected' : ''}>відкинути альтернативу</option>
          <option value="adjust" ${r.action === 'adjust' ? 'selected' : ''}>скоригувати оцінку (%)</option>
        </select>
      </div>
      <div id="modalAdjWrap" class="${r.action === 'adjust' ? 'rule-adjust-wrap' : 'rule-adjust-wrap hidden'}">
        <input id="modalAdjVal" type="number" value="${r.actionValue ?? 0}" min="-100" max="100" step="1" class="rule-val-input"/>
        <span class="rule-pct-label">% (від'ємне = штраф, додатне = бонус)</span>
      </div>
    `,
    onConfirm: async () => {
      const name = document.getElementById('modalRuleName').value.trim();
      const criterion_id = document.getElementById('modalRuleCrit').value;
      const operator = document.getElementById('modalRuleOp').value;
      const value = Number(document.getElementById('modalRuleVal').value);
      const action = document.getElementById('modalRuleAction').value;
      const adjValEl = document.getElementById('modalAdjVal');
      const actionValue = action === 'adjust' ? Number(adjValEl.value) : 0;

      if (!name || !criterion_id || isNaN(value)) {
        showToast('Заповніть всі поля');
        return;
      }

      if (action === 'adjust' && adjValEl.value.trim() === '') {
        showToast('Введіть значення коригування (%)');
        return;
      }

      await api.put(`/rules/${r._id}`, {
        name,
        criterion_id,
        operator,
        value,
        action,
        actionValue,
        enabled: r.enabled,
      });
      showToast('Оновлено', 'success');
      loadRules();
    },
    onOpen: async () => {
      const modalActionSel = document.getElementById('modalRuleAction');
      const modalAdjWrap = document.getElementById('modalAdjWrap');
      modalActionSel.addEventListener('change', () => {
        modalAdjWrap.classList.toggle(
          'hidden',
          modalActionSel.value !== 'adjust',
        );
      });

      const criteria = await api.get('/criteria');
      const sel = document.getElementById('modalRuleCrit');
      criteria.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c._id;
        opt.textContent = c.name;
        if (critId && c._id === critId.toString()) opt.selected = true;
        sel.appendChild(opt);
      });
    },
  });
}

function deleteRule(id) {
  openModal({
    title: 'Підтвердження',
    contentHTML: '<p>Видалити правило?</p>',
    onConfirm: async () => {
      await api.delete(`/rules/${id}`);
      showToast('Видалено', 'success');
      loadRules();
    },
  });
}
