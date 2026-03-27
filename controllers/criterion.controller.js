import criterionService from '../services/criterion.service.js';

class CriterionController {
  async create(request, reply) {
    const result = await criterionService.create(request.body);
    reply.send(result);
  }

  async getAll(request, reply) {
    const result = await criterionService.getAll();
    reply.send(result);
  }

  async getById(request, reply) {
    const result = await criterionService.getById(request.params.id);
    reply.send(result);
  }

  async update(request, reply) {
    const result = await criterionService.update(
      request.params.id,
      request.body,
    );
    reply.send(result);
  }

  async delete(request, reply) {
    const result = await criterionService.delete(request.params.id);
    reply.send(result);
  }
}

export default new CriterionController();
