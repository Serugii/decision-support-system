import { analyzeMatrix } from '../analytics/decision.service.js';
import MatrixService from '../services/matrix.service.js';
import CriterionService from '../services/criterion.service.js';
import alternativeService from '../services/alternative.service.js';

export async function analyze(req, reply) {
  const matrix = await MatrixService.getMatrix();
  const criteria = await CriterionService.getAll();
  const alternatives = await alternativeService.getAll();

  const result = analyzeMatrix(matrix, criteria, alternatives);
  return result;
}
