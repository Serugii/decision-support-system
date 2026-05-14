import ruleRepository from '../repositories/rule.repository.js';

class RuleService {
  async create(data) {
    return await ruleRepository.create(data);
  }

  async getAll() {
    return await ruleRepository.findAll();
  }

  async getById(id) {
    const rule = await ruleRepository.findById(id);
    if (!rule) throw new Error('Rule not found');
    return rule;
  }

  async update(id, data) {
    const rule = await ruleRepository.update(id, data);
    if (!rule) throw new Error('Rule not found');
    return rule;
  }

  async delete(id) {
    const rule = await ruleRepository.delete(id);
    if (!rule) throw new Error('Rule not found');
    return { message: 'Deleted successfully' };
  }
}

export default new RuleService();
