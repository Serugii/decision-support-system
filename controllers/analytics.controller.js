import { analyzeMatrix } from '../analytics/decision.service.js';
import MatrixService from '../services/matrix.service.js';
import CriterionService from '../services/criterion.service.js';
import alternativeService from '../services/alternative.service.js';
import ruleService from '../services/rule.service.js';

export async function analyze(req, reply) {
  const [matrix, criteria, alternatives, rules] = await Promise.all([
    MatrixService.getMatrix(),
    CriterionService.getAll(),
    alternativeService.getAll(),
    ruleService.getAll(),
  ]);

  const result = analyzeMatrix(matrix, criteria, alternatives, rules);
  return result;
}
