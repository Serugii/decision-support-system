import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    criterion_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Criterion',
      required: true,
    },
    operator: {
      type: String,
      enum: ['gt', 'lt', 'gte', 'lte', 'eq'],
      required: true,
    },
    value: { type: Number, required: true },
    action: {
      type: String,
      enum: ['exclude', 'adjust'],
      required: true,
    },
    actionValue: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Rule = mongoose.model('Rule', ruleSchema);

class RuleRepository {
  async create(data) {
    return await Rule.create(data);
  }

  async findAll() {
    return await Rule.find().populate('criterion_id');
  }

  async findById(id) {
    return await Rule.findById(id).populate('criterion_id');
  }

  async update(id, data) {
    return await Rule.findByIdAndUpdate(id, data, { new: true }).populate(
      'criterion_id',
    );
  }

  async delete(id) {
    return await Rule.findByIdAndDelete(id);
  }
}

export default new RuleRepository();
