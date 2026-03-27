export const createEvaluationSchema = {
  body: {
    type: 'object',
    required: ['alternative_id', 'criterion_id', 'value'],
    properties: {
      alternative_id: { type: 'string' },
      criterion_id: { type: 'string' },
      value: { type: 'number' },
    },
  },
};
