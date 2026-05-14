import expertController from '../controllers/expert.controller.js';
import {
  createExpertSchema,
  updateExpertSchema,
} from '../schemas/expert.schema.js';
import {
  createExpertRatingSchema,
  bulkExpertRatingSchema,
} from '../schemas/expert-rating.schema.js';

export default async function (fastify) {
  fastify.post(
    '/experts',
    { schema: createExpertSchema },
    expertController.create,
  );
  fastify.get('/experts', expertController.getAll);
  fastify.put(
    '/experts/:id',
    { schema: updateExpertSchema },
    expertController.update,
  );
  fastify.delete('/experts/:id', expertController.delete);

  fastify.post(
    '/expert-ratings',
    { schema: createExpertRatingSchema },
    expertController.upsertRating,
  );
  fastify.post(
    '/expert-ratings/bulk',
    { schema: bulkExpertRatingSchema },
    expertController.bulkUpsertRatings,
  );
  fastify.get(
    '/expert-ratings/expert/:id',
    expertController.getRatingsByExpert,
  );
  fastify.get('/expert-ratings', expertController.getAllRatings);

  fastify.get('/experts/aggregate/all', expertController.aggregateAll);
}
