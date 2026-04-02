import { analyze } from '../controllers/analytics.controller.js';

export default async function (fastify) {
  fastify.get('/analyze', analyze);
}
