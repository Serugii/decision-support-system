import alternativeService from '../services/alternative.service.js';

class AlternativeController {
  async create(request, reply) {
    const result = await alternativeService.create(request.body);
    reply.send(result);
  }

  async getAll(request, reply) {
    const result = await alternativeService.getAll();
    reply.send(result);
  }

  async getById(request, reply) {
    const result = await alternativeService.getById(request.params.id);
    reply.send(result);
  }

  async update(request, reply) {
    const result = await alternativeService.update(
      request.params.id,
      request.body,
    );
    reply.send(result);
  }

  async delete(request, reply) {
    const result = await alternativeService.delete(request.params.id);
    reply.send(result);
  }
}

export default new AlternativeController();
