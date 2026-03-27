export const envSchema = {
  type: 'object',
  required: ['PORT', 'HOSTNAME', 'NODE_ENV'],
  properties: {
    PORT: { type: 'string' },
    HOSTNAME: { type: 'string' },
    NODE_ENV: { type: 'string', enum: ['development', 'production'] },
  },
};
