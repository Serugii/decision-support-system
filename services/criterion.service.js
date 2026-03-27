import criterionRepository from '../repositories/criterion.repository.js';

class CriterionService {
  async create(data) {
    return await criterionRepository.create(data);
  }

  async getAll() {
    return await criterionRepository.findAll();
  }

  async getById(id) {
    const item = await criterionRepository.findById(id);
    if (!item) {
      throw new Error('Criterion not found');
    }
    return item;
  }

  async update(id, data) {
    const item = await criterionRepository.update(id, data);
    if (!item) {
      throw new Error('Criterion not found');
    }
    return item;
  }

  async delete(id) {
    const item = await criterionRepository.delete(id);
    if (!item) {
      throw new Error('Criterion not found');
    }
    return { message: 'Deleted successfully' };
  }
}

export default new CriterionService();
