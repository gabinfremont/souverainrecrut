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
const application = { id: 'a1', candidateId: 'c1', jobId: 'j1', status: 'PENDING' };

beforeEach(() => mockReset(prismaMock));

describe('/v1/applications', () => {
  it('GET liste (200)', async () => {
    prismaMock.application.findMany.mockResolvedValue([application] as any);
    prismaMock.application.count.mockResolvedValue(1);
    const res = await request(app).get('/v1/applications').set('Authorization', bearer('RECRUITER'));
    expect(res.status).toBe(200);
  });

  it('GET /:id (200)', async () => {
    prismaMock.application.findUnique.mockResolvedValue(application as any);
    const res = await request(app).get('/v1/applications/a1').set('Authorization', bearer('RECRUITER'));
    expect(res.status).toBe(200);
  });

  it('GET /:id inconnu (404)', async () => {
    prismaMock.application.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/v1/applications/x').set('Authorization', bearer('RECRUITER'));
    expect(res.status).toBe(404);
  });

  it('POST crée une candidature (201)', async () => {
    prismaMock.application.create.mockResolvedValue(application as any);
    const res = await request(app).post('/v1/applications').set('Authorization', bearer('RECRUITER'))
      .send({ candidateId: 'c1', jobId: 'j1' });
    expect(res.status).toBe(201);
  });

  it('PUT change le statut (200)', async () => {
    prismaMock.application.findUnique.mockResolvedValue(application as any);
    prismaMock.application.update.mockResolvedValue(application as any);
    const res = await request(app).put('/v1/applications/a1').set('Authorization', bearer('RECRUITER'))
      .send({ status: 'PENDING' });
    expect(res.status).toBe(200);
  });

  it('PUT avec un statut invalide (400)', async () => {
    const res = await request(app).put('/v1/applications/a1').set('Authorization', bearer('RECRUITER'))
      .send({ status: 'N_IMPORTE_QUOI' });
    expect(res.status).toBe(400);
  });

  it('PUT inconnu (404)', async () => {
    prismaMock.application.findUnique.mockResolvedValue(null);
    const res = await request(app).put('/v1/applications/x').set('Authorization', bearer('RECRUITER'))
      .send({ status: 'PENDING' });
    expect(res.status).toBe(404);
  });

  it('DELETE par ADMIN (200)', async () => {
    prismaMock.application.findUnique.mockResolvedValue(application as any);
    prismaMock.application.delete.mockResolvedValue(application as any);
    const res = await request(app).delete('/v1/applications/a1').set('Authorization', bearer('ADMIN'));
    expect(res.status).toBe(200);
  });
});