import alternativeController from '../controllers/alternative.controller.js';
import {
  createAlternativeSchema,
  updateAlternativeSchema,
} from '../schemas/alternative.schema.js';

export default async function (fastify) {
  fastify.post(
    '/alternatives',
    { schema: createAlternativeSchema },
    alternativeController.create,
  );

  fastify.get('/alternatives', alternativeController.getAll);

  fastify.get('/alternatives/:id', alternativeController.getById);

  fastify.put(
    '/alternatives/:id',
    { schema: updateAlternativeSchema },
    alternativeController.update,
  );

  fastify.delete('/alternatives/:id', alternativeController.delete);
}
