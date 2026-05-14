import { Expert } from '../schemas/expert.schema.js';

class ExpertRepository {
  async create(data) {
    return await Expert.create(data);
  }

  async findAll() {
    return await Expert.find().sort({ createdAt: 1 });
  }

  async findById(id) {
    return await Expert.findById(id);
  }

  async update(id, data) {
    return await Expert.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await Expert.findByIdAndDelete(id);
  }
}

export default new ExpertRepository();
