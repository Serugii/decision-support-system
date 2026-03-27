import mongoose from 'mongoose';

const criterionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['maximize', 'minimize'],
      required: true,
    },
    description: String,
  },
  { timestamps: true },
);

const Criterion = mongoose.model('Criterion', criterionSchema);

class CriterionRepository {
  async create(data) {
    return await Criterion.create(data);
  }

  async findAll() {
    return await Criterion.find();
  }

  async findById(id) {
    return await Criterion.findById(id);
  }

  async update(id, data) {
    return await Criterion.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  async delete(id) {
    return await Criterion.findByIdAndDelete(id);
  }
}

export default new CriterionRepository();
