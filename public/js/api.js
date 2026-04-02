import { showToast } from './utils.js';

const API = 'http://localhost:3000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);

  if (!res.ok) {
    showToast('Помилка сервера');
    throw new Error('API error');
  }

  return res.json().catch(() => null);
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  put: (path, body) =>
    request(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  delete: (path) =>
    request(path, {
      method: 'DELETE',
    }),
};
