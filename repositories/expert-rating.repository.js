import { ExpertRating } from '../schemas/expert-rating.schema.js';

class ExpertRatingRepository {
  async upsert(data) {
    const { expert_id, alternative_id, criterion_id, value } = data;
    return await ExpertRating.findOneAndUpdate(
      { expert_id, alternative_id, criterion_id },
      { value },
      { upsert: true, new: true },
    );
  }

  async bulkUpsert(expert_id, ratings) {
    const ops = ratings.map(({ alternative_id, criterion_id, value }) => ({
      updateOne: {
        filter: { expert_id, alternative_id, criterion_id },
        update: { $set: { value } },
        upsert: true,
      },
    }));
    return await ExpertRating.bulkWrite(ops);
  }

  async findByExpert(expert_id) {
    return await ExpertRating.find({ expert_id })
      .populate('alternative_id', 'name')
      .populate('criterion_id', 'name type weight');
  }

  async findAll() {
    return await ExpertRating.find()
      .populate('expert_id', 'name')
      .populate('alternative_id', 'name')
      .populate('criterion_id', 'name type weight');
  }

  async deleteByExpert(expert_id) {
    return await ExpertRating.deleteMany({ expert_id });
  }
}

export default new ExpertRatingRepository();
