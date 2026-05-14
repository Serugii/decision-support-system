import mongoose from 'mongoose';

const expertRatingSchema = new mongoose.Schema(
  {
    expert_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expert',
      required: true,
    },
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
    value: { type: Number, required: true, min: 0, max: 10 },
  },
  { timestamps: true },
);

expertRatingSchema.index(
  { expert_id: 1, alternative_id: 1, criterion_id: 1 },
  { unique: true },
);

export const ExpertRating = mongoose.model('ExpertRating', expertRatingSchema);

export const createExpertRatingSchema = {
  body: {
    type: 'object',
    required: ['expert_id', 'alternative_id', 'criterion_id', 'value'],
    properties: {
      expert_id: { type: 'string' },
      alternative_id: { type: 'string' },
      criterion_id: { type: 'string' },
      value: { type: 'number', minimum: 0, maximum: 10 },
    },
  },
};

export const bulkExpertRatingSchema = {
  body: {
    type: 'object',
    required: ['expert_id', 'ratings'],
    properties: {
      expert_id: { type: 'string' },
      ratings: {
        type: 'array',
        items: {
          type: 'object',
          required: ['alternative_id', 'criterion_id', 'value'],
          properties: {
            alternative_id: { type: 'string' },
            criterion_id: { type: 'string' },
            value: { type: 'number', minimum: 0, maximum: 10 },
          },
        },
      },
    },
  },
};
