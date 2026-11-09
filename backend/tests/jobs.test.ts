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

const job = {
  id: 'j1',
  title: 'Dev Node.js',
  description: 'Développer une API REST',
  location: 'Rennes',
  company: 'ACME',
  recruiterId: 'r1',
};

beforeEach(() => mockReset(prismaMock));

describe('GET /v1/jobs', () => {
  it('renvoie la liste paginée (200)', async () => {
    prismaMock.job.findMany.mockResolvedValue([job] as any);
    prismaMock.job.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/v1/jobs?page=1&limit=5')
      .set('Authorization', bearer('RECRUITER'));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toBeDefined();
  });

  it('fonctionne sans paramètres de pagination', async () => {
    prismaMock.job.findMany.mockResolvedValue([] as any);
    prismaMock.job.count.mockResolvedValue(0);

    const res = await request(app)
      .get('/v1/jobs')
      .set('Authorization', bearer('ADMIN'));

    expect(res.status).toBe(200);
  });
});

describe('GET /v1/jobs/:id', () => {
  it('renvoie l’offre (200)', async () => {
    prismaMock.job.findUnique.mockResolvedValue(job as any);

    const res = await request(app)
      .get('/v1/jobs/j1')
      .set('Authorization', bearer('RECRUITER'));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('j1');
  });

  it('renvoie 404 si l’offre n’existe pas', async () => {
    prismaMock.job.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/v1/jobs/inconnu')
      .set('Authorization', bearer('RECRUITER'));

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Offre introuvable.');
  });
});

describe('POST /v1/jobs', () => {
  const { id, ...body } = job;

  it('crée une offre (201)', async () => {
    prismaMock.job.create.mockResolvedValue(job as any);

    const res = await request(app)
      .post('/v1/jobs')
      .set('Authorization', bearer('RECRUITER'))
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Dev Node.js');
  });

  it('renvoie 400 si le body est invalide', async () => {
    const res = await request(app)
      .post('/v1/jobs')
      .set('Authorization', bearer('RECRUITER'))
      .send({ title: 'a' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThan(0);
    expect(prismaMock.job.create).not.toHaveBeenCalled();
  });
});

describe('PUT /v1/jobs/:id', () => {
  it('met à jour une offre (200)', async () => {
    prismaMock.job.findUnique.mockResolvedValue(job as any);
    prismaMock.job.update.mockResolvedValue({ ...job, title: 'Nouveau titre' } as any);

    const res = await request(app)
      .put('/v1/jobs/j1')
      .set('Authorization', bearer('RECRUITER'))
      .send({ title: 'Nouveau titre' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Nouveau titre');
  });

  it('renvoie 404 si l’offre n’existe pas', async () => {
    prismaMock.job.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put('/v1/jobs/inconnu')
      .set('Authorization', bearer('RECRUITER'))
      .send({ title: 'Nouveau titre' });

    expect(res.status).toBe(404);
    expect(prismaMock.job.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /v1/jobs/:id', () => {
  it('un ADMIN peut supprimer (200)', async () => {
    prismaMock.job.findUnique.mockResolvedValue(job as any);
    prismaMock.job.delete.mockResolvedValue(job as any);

    const res = await request(app)
      .delete('/v1/jobs/j1')
      .set('Authorization', bearer('ADMIN'));

    expect(res.status).toBe(200);
  });

  it('un RECRUITER ne peut pas supprimer (403)', async () => {
    const res = await request(app)
      .delete('/v1/jobs/j1')
      .set('Authorization', bearer('RECRUITER'));

    expect(res.status).toBe(403);
    expect(prismaMock.job.delete).not.toHaveBeenCalled();
  });

  it('renvoie 404 si l’offre n’existe pas', async () => {
    prismaMock.job.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete('/v1/jobs/inconnu')
      .set('Authorization', bearer('ADMIN'));

    expect(res.status).toBe(404);
  });
});