import expertService from '../services/expert.service.js';

class ExpertController {
  // ── Experts ───────────────────────────────────────────────────────────────

  async create(request, reply) {
    const result = await expertService.createExpert(request.body);
    reply.send(result);
  }

  async getAll(request, reply) {
    const result = await expertService.getExperts();
    reply.send(result);
  }

  async update(request, reply) {
    const result = await expertService.updateExpert(
      request.params.id,
      request.body,
    );
    reply.send(result);
  }

  async delete(request, reply) {
    await expertService.deleteExpert(request.params.id);
    reply.send({ success: true });
  }

  // ── Ratings ───────────────────────────────────────────────────────────────

  async upsertRating(request, reply) {
    const result = await expertService.upsertRating(request.body);
    reply.send(result);
  }

  async bulkUpsertRatings(request, reply) {
    const { expert_id, ratings } = request.body;
    await expertService.bulkUpsertRatings(expert_id, ratings);
    reply.send({ success: true });
  }

  async getRatingsByExpert(request, reply) {
    const result = await expertService.getRatingsByExpert(request.params.id);
    reply.send(result);
  }

  async getAllRatings(request, reply) {
    const result = await expertService.getAllRatings();
    reply.send(result);
  }

  // ── Aggregation ───────────────────────────────────────────────────────────

  async aggregateAll(request, reply) {
    const result = await expertService.aggregateAll();
    reply.send(result);
  }
}

export default new ExpertController();
