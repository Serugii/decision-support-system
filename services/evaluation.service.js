import evaluationRepository from '../repositories/evaluation.repository.js';
import alternativeRepository from '../repositories/alternative.repository.js';
import criterionRepository from '../repositories/criterion.repository.js';

class EvaluationService {
  async create(data) {
    const alternative = await alternativeRepository.findById(
      data.alternative_id,
    );
    if (!alternative) {
      throw new Error('Alternative not found');
    }

    const criterion = await criterionRepository.findById(data.criterion_id);
    if (!criterion) {
      throw new Error('Criterion not found');
    }

    return await evaluationRepository.create(data);
  }

  async getAll() {
    return await evaluationRepository.findAll();
  }
}

export default new EvaluationService();
