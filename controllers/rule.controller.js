import ruleService from '../services/rule.service.js';

export async function getAll(req, reply) {
  return await ruleService.getAll();
}

export async function create(req, reply) {
  const rule = await ruleService.create(req.body);
  reply.code(201).send(rule);
}

export async function update(req, reply) {
  return await ruleService.update(req.params.id, req.body);
}

export async function remove(req, reply) {
  return await ruleService.delete(req.params.id);
}
