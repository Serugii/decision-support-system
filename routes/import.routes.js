import { importCsv } from '../controllers/import.controller.js';

export default async function (fastify) {
  fastify.post('/import/csv', importCsv);
}
