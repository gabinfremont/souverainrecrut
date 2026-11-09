import request from 'supertest';

jest.mock('../src/config/prisma', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

import app from '../src/app';
import { bearer } from './helpers';

const resources = ['jobs', 'candidates', 'applications', 'users'];

describe.each(resources)('contrôle d’accès /v1/%s', (resource) => {
  const url = `/v1/${resource}`;

  it('GET sans token renvoie 401', async () => {
    expect((await request(app).get(url)).status).toBe(401);
  });

  it('POST sans token renvoie 401', async () => {
    expect((await request(app).post(url).send({})).status).toBe(401);
  });

  it('DELETE par un RECRUITER renvoie 403', async () => {
    const res = await request(app)
      .delete(`${url}/1`)
      .set('Authorization', bearer('RECRUITER'));
    expect(res.status).toBe(403);
  });

  it('POST avec un body vide renvoie 400 pour un ADMIN', async () => {
    const res = await request(app)
      .post(url)
      .set('Authorization', bearer('ADMIN'))
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('ressource /v1/users réservée aux ADMIN', () => {
  it('GET par un RECRUITER renvoie 403', async () => {
    const res = await request(app)
      .get('/v1/users')
      .set('Authorization', bearer('RECRUITER'));
    expect(res.status).toBe(403);
  });
});