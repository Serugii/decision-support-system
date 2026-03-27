import criterionController from '../controllers/criterion.controller.js';
import {
  createCriterionSchema,
  updateCriterionSchema,
} from '../schemas/criterion.schema.js';

export default async function (fastify) {
  fastify.post(
    '/criteria',
    { schema: createCriterionSchema },
    criterionController.create,
  );

  fastify.get('/criteria', criterionController.getAll);

  fastify.get('/criteria/:id', criterionController.getById);

  fastify.put(
    '/criteria/:id',
    { schema: updateCriterionSchema },
    criterionController.update,
  );

  fastify.delete('/criteria/:id', criterionController.delete);
}
