import mongoose from 'mongoose';

const expertSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Expert = mongoose.model('Expert', expertSchema);

export const createExpertSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
    },
  },
};

export const updateExpertSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
    },
  },
};
