export const createCriterionSchema = {
  body: {
    type: 'object',
    required: ['name', 'type'],
    properties: {
      name: { type: 'string' },
      type: { type: 'string', enum: ['maximize', 'minimize'] },
      description: { type: 'string' },
    },
  },
};

export const updateCriterionSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      type: { type: 'string', enum: ['maximize', 'minimize'] },
      description: { type: 'string' },
    },
  },
};
