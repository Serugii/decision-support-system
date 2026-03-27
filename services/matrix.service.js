import alternativeRepository from '../repositories/alternative.repository.js';
import criterionRepository from '../repositories/criterion.repository.js';
import evaluationRepository from '../repositories/evaluation.repository.js';

class MatrixService {
  async getMatrix() {
    const alternatives = await alternativeRepository.findAll();
    const criteria = await criterionRepository.findAll();
    const evaluations = await evaluationRepository.findAll();

    const validEvaluations = evaluations.filter(
      (e) => e.alternative_id && e.criterion_id,
    );

    const evalMap = new Map();

    validEvaluations.forEach((e) => {
      const altId = e.alternative_id._id.toString();
      const critId = e.criterion_id._id.toString();

      const key = `${altId}_${critId}`;

      evalMap.set(key, e.value);
    });

    const matrix = alternatives.map((alt) => {
      const row = {
        alternative: alt.name,
        alternative_id: alt._id,
        criteria: {},
      };

      criteria.forEach((crit) => {
        const key = `${alt._id.toString()}_${crit._id.toString()}`;

        row.criteria[crit._id] = {
          name: crit.name,
          value: evalMap.get(key) ?? null,
        };
      });

      return row;
    });

    return matrix;
  }
}

export default new MatrixService();
