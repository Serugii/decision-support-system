class DecisionService {
  calculate() {
    throw new Error('Not implemented yet');
  }
  rankAlternatives() {
    throw new Error('Not implemented yet');
  }
}

export default new DecisionService();

// ─── Operator helper ───────────────────────────────────────────────────────
function matchOperator(operator, cellValue, ruleValue) {
  switch (operator) {
    case 'gt':
      return cellValue > ruleValue;
    case 'lt':
      return cellValue < ruleValue;
    case 'gte':
      return cellValue >= ruleValue;
    case 'lte':
      return cellValue <= ruleValue;
    case 'eq':
      return cellValue === ruleValue;
    default:
      return false;
  }
}

// ─── Threshold filter ──────────────────────────────────────────────────────
function applyThresholds(matrix, criteria) {
  const admissible = [];
  const excluded = [];

  for (const row of matrix) {
    const reasons = [];

    for (const crit of criteria) {
      if (!crit.thresholdEnabled) continue;
      const critId = crit._id.toString();
      const cell = row.criteria[critId];
      if (!cell) continue;
      const val = Number(cell.value);

      if (
        crit.thresholdMin !== null &&
        crit.thresholdMin !== undefined &&
        val < crit.thresholdMin
      ) {
        reasons.push(
          `«${crit.name}»: значення ${val} < мін. порогу ${crit.thresholdMin}`,
        );
      }
      if (
        crit.thresholdMax !== null &&
        crit.thresholdMax !== undefined &&
        val > crit.thresholdMax
      ) {
        reasons.push(
          `«${crit.name}»: значення ${val} > макс. порогу ${crit.thresholdMax}`,
        );
      }
    }

    if (reasons.length === 0) {
      admissible.push(row);
    } else {
      excluded.push({ alternative: row.alternative, reasons });
    }
  }

  return { admissible, excluded };
}

// ─── Rule engine ───────────────────────────────────────────────────────────
function applyRules(rows, rules) {
  const ruleLog = [];
  const result = [];

  for (const row of rows) {
    const adjustedCriteria = {};
    for (const [critId, cell] of Object.entries(row.criteria)) {
      adjustedCriteria[critId] = { ...cell, value: Number(cell.value) };
    }

    let excluded = false;

    for (const rule of rules) {
      if (!rule.enabled) continue;

      const critId = (rule.criterion_id._id || rule.criterion_id).toString();
      const cell = adjustedCriteria[critId];
      if (!cell) continue;

      const cellValue = Number(cell.value);

      if (!matchOperator(rule.operator, cellValue, rule.value)) continue;

      if (rule.action === 'exclude') {
        excluded = true;
        ruleLog.push({
          alternative: row.alternative,
          ruleName: rule.name,
          action: 'exclude',
          detail: `Відкинуто правилом «${rule.name}»`,
        });
        break;
      }

      if (rule.action === 'adjust') {
        const pct = rule.actionValue / 100;
        const oldValue = cell.value;
        cell.value = Math.max(0, Math.min(10, oldValue * (1 + pct)));
        ruleLog.push({
          alternative: row.alternative,
          ruleName: rule.name,
          action: 'adjust',
          detail: `«${rule.name}»: оцінка «${cell.name}» ${oldValue} → ${cell.value.toFixed(2)} (${rule.actionValue > 0 ? '+' : ''}${rule.actionValue}%)`,
        });
      }
    }

    if (!excluded) {
      result.push({ ...row, criteria: adjustedCriteria });
    }
  }

  return { rows: result, ruleLog };
}

// ─── Core scoring ──────────────────────────────────────────────────────────
function scoreRows(rows, criteria) {
  const additive = [];
  const multiplicative = [];
  const cautious = [];

  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 1), 0);
  const getWeight = (c) => (c.weight || 1) / totalWeight;

  for (const row of rows) {
    let additiveScore = 0;
    let multiplicativeScore = 1;
    const cautiousValues = [];

    for (const crit of criteria) {
      const critId = crit._id.toString();
      const item = row.criteria[critId];
      if (!item) continue;

      let value = Number(item.value);
      if (isNaN(value)) continue;

      const weight = getWeight(crit);

      if (crit.type === 'minimize') {
        if (value === 0) value = 0.0001;
        value = 1 / value;
      }

      additiveScore += value * weight;
      multiplicativeScore *= Math.pow(value, weight);
      cautiousValues.push(value * weight);
    }

    const cautiousScore =
      cautiousValues.length > 0 ? Math.min(...cautiousValues) : 0;

    additive.push({ alt: row.alternative, score: additiveScore });
    multiplicative.push({ alt: row.alternative, score: multiplicativeScore });
    cautious.push({ alt: row.alternative, score: cautiousScore });
  }

  return { additive, multiplicative, cautious };
}

// ─── Main export ───────────────────────────────────────────────────────────
function sortByScore(items) {
  return [...(items || [])].sort((a, b) => b.score - a.score);
}

function getWinner(items) {
  const sorted = sortByScore(items);
  return sorted[0] || null;
}

function getMethodWinners(scores) {
  return {
    additive: getWinner(scores.additive),
    multiplicative: getWinner(scores.multiplicative),
    cautious: getWinner(scores.cautious),
  };
}

function buildContributions(rows, criteria) {
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 1), 0);
  const getWeight = (c) => (c.weight || 1) / totalWeight;

  return rows.map((row) => {
    const criteriaImpact = criteria
      .map((crit) => {
        const critId = crit._id.toString();
        const item = row.criteria[critId];
        if (!item) return null;

        let value = Number(item.value);
        if (isNaN(value)) return null;

        if (crit.type === 'minimize') {
          if (value === 0) value = 0.0001;
          value = 1 / value;
        }

        const normalizedWeight = getWeight(crit);
        return {
          criterion: crit.name,
          weight: crit.weight || 1,
          normalizedWeight,
          value,
          contribution: value * normalizedWeight,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.contribution - a.contribution);

    return {
      alternative: row.alternative,
      criteria: criteriaImpact,
    };
  });
}

function buildExplanation(scores, contributions, ruleLog, excluded) {
  const winners = getMethodWinners(scores);
  const additiveWinner = winners.additive;

  if (!additiveWinner) {
    return {
      winner: null,
      text: 'Немає допустимих альтернатив для пояснення результату.',
      reasons: [],
      appliedRules: ruleLog,
    };
  }

  const winnerImpact =
    contributions.find((item) => item.alternative === additiveWinner.alt)
      ?.criteria || [];
  const topCriteria = winnerImpact.slice(0, 3);
  const reasons = topCriteria.map(
    (item) =>
      `${item.criterion}: внесок ${item.contribution.toFixed(3)} при вазі ${item.weight}`,
  );

  return {
    winner: additiveWinner.alt,
    text: `За базовим методом SAW найкращою є альтернатива «${additiveWinner.alt}» з оцінкою ${additiveWinner.score.toFixed(3)}. Найбільше на результат вплинули критерії: ${topCriteria.map((item) => item.criterion).join(', ') || 'немає даних'}.`,
    reasons,
    appliedRules: ruleLog,
    excludedCount: excluded.length,
  };
}

function buildMethodComparison(scores) {
  const labels = {
    additive: 'Адитивна згортка (SAW)',
    multiplicative: 'Мультиплікативна згортка',
    cautious: 'Обережна стратегія (Minimax)',
  };

  return Object.entries(labels).map(([key, label]) => {
    const winner = getWinner(scores[key]);
    return {
      method: key,
      label,
      winner: winner?.alt || null,
      score: winner?.score ?? null,
    };
  });
}

function cloneCriteriaWithWeightChange(criteria, criterionId, multiplier) {
  return criteria.map((crit) => {
    const plain = typeof crit.toObject === 'function' ? crit.toObject() : crit;
    return {
      ...plain,
      _id: crit._id,
      name: crit.name,
      type: crit.type,
      weight:
        crit._id.toString() === criterionId
          ? Math.max(0.01, (crit.weight || 1) * multiplier)
          : crit.weight,
    };
  });
}

function buildSensitivity(rows, criteria, baseScores) {
  const baseWinner = getWinner(baseScores.additive)?.alt || null;

  return criteria.map((crit) => {
    const critId = crit._id.toString();
    const upScores = scoreRows(
      rows,
      cloneCriteriaWithWeightChange(criteria, critId, 1.2),
    );
    const downScores = scoreRows(
      rows,
      cloneCriteriaWithWeightChange(criteria, critId, 0.8),
    );
    const upWinner = getWinner(upScores.additive)?.alt || null;
    const downWinner = getWinner(downScores.additive)?.alt || null;

    return {
      criterion: crit.name,
      baseWeight: crit.weight || 1,
      increasedWinner: upWinner,
      decreasedWinner: downWinner,
      changesDecision: upWinner !== baseWinner || downWinner !== baseWinner,
    };
  });
}

function buildStability(scores) {
  const winners = getMethodWinners(scores);
  const winnerNames = Object.values(winners)
    .map((winner) => winner?.alt)
    .filter(Boolean);
  const uniqueWinners = [...new Set(winnerNames)];
  const additiveSorted = sortByScore(scores.additive);
  const margin =
    additiveSorted.length > 1
      ? additiveSorted[0].score - additiveSorted[1].score
      : additiveSorted[0]?.score || 0;

  const stableByMethods = uniqueWinners.length <= 1 && winnerNames.length > 0;
  const stableByMargin = margin >= 0.1;

  return {
    stable: stableByMethods && stableByMargin,
    methodAgreement: stableByMethods,
    margin,
    summary:
      stableByMethods && stableByMargin
        ? 'Рішення стабільне: методи обрали одну альтернативу, а відрив лідера достатній.'
        : 'Рішення потребує уваги: різні методи або малий відрив можуть змінити підсумок.',
  };
}

function buildScenarioAnalysis(rows, criteria, baseScores) {
  const baseWinner = getWinner(baseScores.additive)?.alt || null;
  const topCriterion = [...criteria].sort(
    (a, b) => (b.weight || 1) - (a.weight || 1),
  )[0];
  const scenarios = [
    {
      name: 'Базовий сценарій',
      description: 'Поточні ваги критеріїв і оцінки.',
      criteria,
    },
    {
      name: 'Акцент на найважливіший критерій',
      description:
        'Вага критерію з найбільшою поточною вагою збільшена на 25%.',
      criteria: topCriterion
        ? cloneCriteriaWithWeightChange(
            criteria,
            topCriterion._id.toString(),
            1.25,
          )
        : criteria,
    },
    {
      name: 'Згладжені пріоритети',
      description: 'Усі ваги наближені до однакових значень.',
      criteria: criteria.map((crit) => {
        const plain =
          typeof crit.toObject === 'function' ? crit.toObject() : crit;
        return {
          ...plain,
          _id: crit._id,
          name: crit.name,
          type: crit.type,
          weight: 1,
        };
      }),
    },
  ];

  return scenarios.map((scenario) => {
    const scenarioScores = scoreRows(rows, scenario.criteria);
    const winner = getWinner(scenarioScores.additive);
    return {
      name: scenario.name,
      description: scenario.description,
      winner: winner?.alt || null,
      score: winner?.score ?? null,
      changed: (winner?.alt || null) !== baseWinner,
    };
  });
}

export function analyzeMatrix(matrix, criteria, alternatives, rules = []) {
  const { admissible, excluded: thresholdExcluded } = applyThresholds(
    matrix,
    criteria,
  );
  const { rows: ruleFiltered, ruleLog } = applyRules(admissible, rules);
  const scores = scoreRows(ruleFiltered, criteria);
  const excluded = [
    ...thresholdExcluded.map((e) => ({
      alternative: e.alternative,
      reasons: e.reasons,
      source: 'threshold',
    })),
    ...ruleLog
      .filter((l) => l.action === 'exclude')
      .map((l) => ({
        alternative: l.alternative,
        reasons: [l.detail],
        source: 'rule',
      })),
  ];
  const appliedRules = ruleLog.filter((l) => l.action === 'adjust');
  const contributions = buildContributions(ruleFiltered, criteria);

  return {
    ...scores,
    admissible: ruleFiltered.map((r) => r.alternative),
    excluded,
    ruleLog: appliedRules,
    explanation: buildExplanation(scores, contributions, ruleLog, excluded),
    influentialCriteria: contributions,
    methodComparison: buildMethodComparison(scores),
    sensitivity: buildSensitivity(ruleFiltered, criteria, scores),
    stability: buildStability(scores),
    scenarios: buildScenarioAnalysis(ruleFiltered, criteria, scores),
  };
}
