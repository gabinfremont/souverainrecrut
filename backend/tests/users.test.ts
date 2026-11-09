import request from 'supertest';
import bcrypt from 'bcrypt';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('../src/config/prisma', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

import { prisma } from '../src/config/prisma';
import app from '../src/app';
import { bearer } from './helpers';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const user = {
  id: 'u1', firstName: 'Awa', lastName: 'Diallo', email: 'awa@mail.fr',
  role: 'ADMIN', password: bcrypt.hashSync('secret123', 4),
};

beforeEach(() => mockReset(prismaMock));

describe('/v1/auth', () => {
  it('POST /login réussit (200)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user as any);
    const res = await request(app).post('/v1/auth/login').send({ email: 'awa@mail.fr', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('POST /login avec un mauvais mot de passe (401)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user as any);
    const res = await request(app).post('/v1/auth/login').send({ email: 'awa@mail.fr', password: 'faux' });
    expect(res.status).toBe(401);
  });

  it('GET /me renvoie le profil (200)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user as any);
    const res = await request(app).get('/v1/auth/me').set('Authorization', bearer('ADMIN'));
    expect(res.status).toBe(200);
  });

  it('GET /me utilisateur supprimé (404)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/v1/auth/me').set('Authorization', bearer('ADMIN'));
    expect(res.status).toBe(404);
  });
});

describe('/v1/users (ADMIN)', () => {
  const body = { firstName: 'Awa', lastName: 'Diallo', email: 'new@mail.fr', password: 'secret123' };

  it('GET liste (200)', async () => {
    prismaMock.user.findMany.mockResolvedValue([user] as any);
    prismaMock.user.count.mockResolvedValue(1);
    const res = await request(app).get('/v1/users').set('Authorization', bearer('ADMIN'));
    expect(res.status).toBe(200);
  });

  it('GET /:id (200)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user as any);
    const res = await request(app).get('/v1/users/u1').set('Authorization', bearer('ADMIN'));
    expect(res.status).toBe(200);
  });

  it('GET /:id inconnu (404)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/v1/users/x').set('Authorization', bearer('ADMIN'));
    expect(res.status).toBe(404);
  });

  it('POST crée un utilisateur et hache le mot de passe (201)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(user as any);
    const res = await request(app).post('/v1/users').set('Authorization', bearer('ADMIN')).send(body);
    expect(res.status).toBe(201);
    const arg: any = prismaMock.user.create.mock.calls[0][0];
    expect(arg.data.password).not.toBe('secret123');
  });

  it('POST avec un email déjà utilisé (409)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user as any);
    const res = await request(app).post('/v1/users').set('Authorization', bearer('ADMIN')).send(body);
    expect(res.status).toBe(409);
  });

  it('PUT met à jour (200)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user as any);
    prismaMock.user.update.mockResolvedValue(user as any);
    const res = await request(app).put('/v1/users/u1').set('Authorization', bearer('ADMIN')).send({ firstName: 'Fatou' });
    expect(res.status).toBe(200);
  });

  it('DELETE (200)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user as any);
    prismaMock.user.delete.mockResolvedValue(user as any);
    const res = await request(app).delete('/v1/users/u1').set('Authorization', bearer('ADMIN'));
    expect(res.status).toBe(200);
  });
});