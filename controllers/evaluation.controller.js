import evaluationService from '../services/evaluation.service.js';

class EvaluationController {
  async create(request, reply) {
    const result = await evaluationService.create(request.body);
    reply.send(result);
  }

  async getAll(request, reply) {
    const result = await evaluationService.getAll();
    reply.send(result);
  }
}

export default new EvaluationController();
