import alternativeService from '../services/alternative.service.js';
import criterionService from '../services/criterion.service.js';
import evaluationService from '../services/evaluation.service.js';

export async function importCsv(req, reply) {
  const { alternatives = [], criteria = [], evaluations = [] } = req.body;

  const createdAlts = await Promise.all(
    alternatives.map((a) => alternativeService.create(a)),
  );

  const createdCriteria = await Promise.all(
    criteria.map((c) => criterionService.create(c)),
  );

  const createdEvals = await Promise.all(
    evaluations.map((e) => {
      const alt = createdAlts[e.alternativeIndex];
      const crit = createdCriteria[e.criterionIndex];

      if (!alt || !crit) return null;

      return evaluationService.create({
        alternative_id: alt._id.toString(),
        criterion_id: crit._id.toString(),
        value: e.value,
      });
    }),
  );

  return reply.send({
    alternatives: createdAlts,
    criteria: createdCriteria,
    evaluations: createdEvals.filter(Boolean),
  });
}
