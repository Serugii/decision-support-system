import alternativeRepository from '../repositories/alternative.repository.js';

class AlternativeService {
  async create(data) {
    return await alternativeRepository.create(data);
  }

  async getAll() {
    return await alternativeRepository.findAll();
  }

  async getById(id) {
    const alt = await alternativeRepository.findById(id);
    if (!alt) {
      throw new Error('Alternative not found');
    }
    return alt;
  }

  async update(id, data) {
    const alt = await alternativeRepository.update(id, data);
    if (!alt) {
      throw new Error('Alternative not found');
    }
    return alt;
  }

  async delete(id) {
    const alt = await alternativeRepository.delete(id);
    if (!alt) {
      throw new Error('Alternative not found');
    }
    return { message: 'Deleted successfully' };
  }
}

export default new AlternativeService();
