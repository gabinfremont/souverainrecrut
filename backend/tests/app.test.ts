import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/prisma', () => {
  const { mockDeep } = require('jest-mock-extended');
  return { prisma: mockDeep() };
});

import app from '../src/app';

describe('API : routes générales', () => {
  it('GET / renvoie le message de bienvenue', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /route-inconnue renvoie 404', async () => {
    const res = await request(app).get('/route-inconnue');
    expect(res.status).toBe(404);
  });
});

describe('API : authentification et accès', () => {
  it('GET /v1/auth/me sans token renvoie 401', async () => {
    const res = await request(app).get('/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /v1/auth/me avec un faux token renvoie 401', async () => {
    const res = await request(app).get('/v1/auth/me').set('Authorization', 'Bearer faux');
    expect(res.status).toBe(401);
  });

  it('GET /v1/auth/me avec un token valide ne renvoie pas 401', async () => {
    const token = jwt.sign({ id: 'u1', role: 'ADMIN' }, process.env.JWT_SECRET as string);
    const res = await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(401);
  });
});