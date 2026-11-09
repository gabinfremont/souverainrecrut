import request from 'supertest';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('../src/config/prisma', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

import { prisma } from '../src/config/prisma';
import app from '../src/app';
import { bearer } from './helpers';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const candidate = { id: 'c1', fullName: 'Awa Diallo', email: 'awa@mail.fr', phone: '0612345678' };
const { id, ...body } = candidate;

beforeEach(() => mockReset(prismaMock));

describe('/v1/candidates', () => {
  it('GET liste (200)', async () => {
    prismaMock.candidate.findMany.mockResolvedValue([candidate] as any);
    prismaMock.candidate.count.mockResolvedValue(1);
    const res = await request(app).get('/v1/candidates').set('Authorization', bearer('RECRUITER'));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('GET /:id (200)', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue(candidate as any);
    const res = await request(app).get('/v1/candidates/c1').set('Authorization', bearer('ADMIN'));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('c1');
  });

  it('GET /:id inconnu (404)', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/v1/candidates/x').set('Authorization', bearer('ADMIN'));
    expect(res.status).toBe(404);
  });

  it('POST crée un candidat (201)', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue(null);
    prismaMock.candidate.create.mockResolvedValue(candidate as any);
    const res = await request(app).post('/v1/candidates').set('Authorization', bearer('RECRUITER')).send(body);
    expect(res.status).toBe(201);
  });

  it('POST avec un email déjà utilisé (409)', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue(candidate as any);
    const res = await request(app).post('/v1/candidates').set('Authorization', bearer('RECRUITER')).send(body);
    expect(res.status).toBe(409);
    expect(prismaMock.candidate.create).not.toHaveBeenCalled();
  });

  it('PUT met à jour (200)', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue(candidate as any);
    prismaMock.candidate.update.mockResolvedValue({ ...candidate, fullName: 'Awa Camara' } as any);
    const res = await request(app).put('/v1/candidates/c1').set('Authorization', bearer('RECRUITER')).send({ fullName: 'Awa Camara' });
    expect(res.status).toBe(200);
  });

  it('PUT inconnu (404)', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue(null);
    const res = await request(app).put('/v1/candidates/x').set('Authorization', bearer('RECRUITER')).send({ fullName: 'Awa Camara' });
    expect(res.status).toBe(404);
  });

  it('DELETE par ADMIN (200)', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue(candidate as any);
    prismaMock.candidate.delete.mockResolvedValue(candidate as any);
    const res = await request(app).delete('/v1/candidates/c1').set('Authorization', bearer('ADMIN'));
    expect(res.status).toBe(200);
  });
});