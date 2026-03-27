import evaluationController from '../controllers/evaluation.controller.js';
import { createEvaluationSchema } from '../schemas/evaluation.schema.js';

export default async function (fastify) {
  fastify.post(
    '/evaluations',
    { schema: createEvaluationSchema },
    evaluationController.create,
  );

  fastify.get('/evaluations', evaluationController.getAll);
}
