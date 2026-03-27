import mongoose from 'mongoose';

const alternativeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
  },
  { timestamps: true },
);

const Alternative = mongoose.model('Alternative', alternativeSchema);

class AlternativeRepository {
  async create(data) {
    return await Alternative.create(data);
  }

  async findAll() {
    return await Alternative.find();
  }

  async findById(id) {
    return await Alternative.findById(id);
  }

  async update(id, data) {
    return await Alternative.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  async delete(id) {
    return await Alternative.findByIdAndDelete(id);
  }
}

export default new AlternativeRepository();
