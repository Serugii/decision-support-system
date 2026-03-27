import matrixController from '../controllers/matrix.controller.js';

export default async function (fastify) {
  fastify.get('/matrix', matrixController.getMatrix);
}
