import expertRepository from '../repositories/expert.repository.js';
import expertRatingRepository from '../repositories/expert-rating.repository.js';

class ExpertService {

  async createExpert(data) {
    return await expertRepository.create(data);
  }

  async getExperts() {
    return await expertRepository.findAll();
  }

  async updateExpert(id, data) {
    const expert = await expertRepository.findById(id);
    if (!expert) throw new Error('Expert not found');
    return await expertRepository.update(id, data);
  }

  async deleteExpert(id) {
    await expertRatingRepository.deleteByExpert(id);
    return await expertRepository.delete(id);
  }

  async upsertRating(data) {
    return await expertRatingRepository.upsert(data);
  }

  async bulkUpsertRatings(expert_id, ratings) {
    return await expertRatingRepository.bulkUpsert(expert_id, ratings);
  }

  async getRatingsByExpert(expert_id) {
    return await expertRatingRepository.findByExpert(expert_id);
  }

  async getAllRatings() {
    return await expertRatingRepository.findAll();
  }

  async _buildRatingMap() {
    const ratings = await expertRatingRepository.findAll();
    const map = {};

    for (const r of ratings) {
      const altId = r.alternative_id._id.toString();
      const critId = r.criterion_id._id.toString();

      if (!map[altId]) map[altId] = {};
      if (!map[altId][critId]) map[altId][critId] = [];

      map[altId][critId].push(r.value);
    }

    return { map, ratings };
  }

  async aggregateAlgebraic() {
    const { map, ratings } = await this._buildRatingMap();
    return this._aggregate(map, ratings, 'algebraic');
  }

  async aggregateMedian() {
    const { map, ratings } = await this._buildRatingMap();
    return this._aggregate(map, ratings, 'median');
  }

  async aggregateMode() {
    const { map, ratings } = await this._buildRatingMap();
    return this._aggregate(map, ratings, 'mode');
  }

  _aggregate(map, ratings, method) {
    const result = [];

    const altNames = {};
    const critNames = {};
    for (const r of ratings) {
      altNames[r.alternative_id._id.toString()] = r.alternative_id.name;
      critNames[r.criterion_id._id.toString()] = r.criterion_id.name;
    }

    for (const [altId, crits] of Object.entries(map)) {
      for (const [critId, values] of Object.entries(crits)) {
        let score;

        if (method === 'algebraic') {
          score = values.reduce((s, v) => s + v, 0) / values.length;
        } else if (method === 'median') {
          const sorted = [...values].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          score =
            sorted.length % 2 === 0
              ? (sorted[mid - 1] + sorted[mid]) / 2
              : sorted[mid];
        } else if (method === 'mode') {
          const freq = {};
          let maxFreq = 0;
          for (const v of values) {
            freq[v] = (freq[v] || 0) + 1;
            if (freq[v] > maxFreq) maxFreq = freq[v];
          }
          const modes = Object.entries(freq)
            .filter(([, f]) => f === maxFreq)
            .map(([v]) => Number(v));
          score = modes.reduce((s, v) => s + v, 0) / modes.length;
        }

        result.push({
          alternative_id: altId,
          criterion_id: critId,
          altName: altNames[altId] || altId,
          critName: critNames[critId] || critId,
          value: Math.round(score * 1000) / 1000,
          rawValues: [...values],
        });
      }
    }

    return result;
  }

  _deepCopyMap(map) {
    const copy = {};
    for (const [altId, crits] of Object.entries(map)) {
      copy[altId] = {};
      for (const [critId, values] of Object.entries(crits)) {
        copy[altId][critId] = [...values];
      }
    }
    return copy;
  }

  async aggregateAll() {
    const { map, ratings } = await this._buildRatingMap();
    return {
      algebraic: this._aggregate(this._deepCopyMap(map), ratings, 'algebraic'),
      median: this._aggregate(this._deepCopyMap(map), ratings, 'median'),
      mode: this._aggregate(this._deepCopyMap(map), ratings, 'mode'),
    };
  }
}

export default new ExpertService();
