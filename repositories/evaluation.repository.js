import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema(
  {
    alternative_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alternative',
      required: true,
    },
    criterion_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Criterion',
      required: true,
    },
    value: { type: Number, required: true },
  },
  { timestamps: true },
);

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

class EvaluationRepository {
  async create(data) {
    return await Evaluation.create(data);
  }

  async findAll() {
    return await Evaluation.find()
      .populate('alternative_id')
      .populate('criterion_id');
  }
}

export default new EvaluationRepository();
