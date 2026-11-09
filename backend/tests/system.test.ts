import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('../src/config/prisma', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

import { prisma } from '../src/config/prisma';
import { HealthService } from '../src/services/health.service';
import { InfoService } from '../src/services/info.service';
import { DashboardService } from '../src/services/dashboard.service';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => mockReset(prismaMock));

describe('HealthService', () => {
  it('health renvoie UP', async () => {
    expect((await new HealthService().health()).status).toBe('UP');
  });

  it('readiness renvoie READY si la base répond', async () => {
    prismaMock.$queryRaw.mockResolvedValue([1] as any);
    expect((await new HealthService().readiness()).status).toBe('READY');
  });

  it('readiness renvoie NOT_READY si la base est KO', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('down'));
    expect((await new HealthService().readiness()).status).toBe('NOT_READY');
  });
});

describe('InfoService', () => {
  it('renvoie les informations de l’API', () => {
    const info = new InfoService().getInfo();
    expect(info.name).toBe('SouverainRecrut API');
    expect(info.health).toBe('/v1/health');
  });
});

describe('DashboardService', () => {
  it('agrège les statistiques', async () => {
    prismaMock.user.count.mockResolvedValue(2);
    prismaMock.candidate.count.mockResolvedValue(3);
    prismaMock.job.count.mockResolvedValue(4);
    prismaMock.application.count.mockResolvedValue(5);
    const stats = await new DashboardService().getStatistics();
    expect(stats).toEqual({ users: 2, candidates: 3, jobs: 4, applications: 5, pendingApplications: 5 });
  });
});