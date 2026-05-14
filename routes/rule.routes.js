import * as ruleController from '../controllers/rule.controller.js';

export default async function (fastify) {
  fastify.get('/rules', ruleController.getAll);
  fastify.post('/rules', ruleController.create);
  fastify.put('/rules/:id', ruleController.update);
  fastify.delete('/rules/:id', ruleController.remove);
}
