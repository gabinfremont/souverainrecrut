import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { authMiddleware } from '../src/middlewares/auth.middleware';
import { authorize } from '../src/middlewares/authorize.middleware';
import { validate } from '../src/middlewares/validate.middleware';
import { errorMiddleware } from '../src/middlewares/error.middleware';
import { notFoundMiddleware } from '../src/middlewares/not-found.middleware';
import { AppError } from '../src/errors/app.error';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('authMiddleware', () => {
  it('rejette une requête sans header Authorization (401)', () => {
    const next = jest.fn();
    authMiddleware({ headers: {} } as Request, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('rejette un schéma autre que Bearer (401)', () => {
    const next = jest.fn();
    authMiddleware({ headers: { authorization: 'Basic abc' } } as Request, mockRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('rejette un token invalide (401)', () => {
    const next = jest.fn();
    authMiddleware({ headers: { authorization: 'Bearer nimportequoi' } } as Request, mockRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('rejette un token signé avec un autre secret (401)', () => {
    const token = jwt.sign({ id: '1', role: 'ADMIN' }, 'autre-secret');
    const next = jest.fn();
    authMiddleware({ headers: { authorization: `Bearer ${token}` } } as Request, mockRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('accepte un token valide et renseigne req.user', () => {
    const token = jwt.sign({ id: 'u1', role: 'ADMIN' }, process.env.JWT_SECRET as string);
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();
    authMiddleware(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 'u1', role: 'ADMIN' });
  });
});

describe('authorize (contrôle des accès)', () => {
  it('renvoie 401 si aucun utilisateur n’est authentifié', () => {
    const next = jest.fn();
    authorize('ADMIN' as any)({} as Request, mockRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('renvoie 403 si le rôle n’est pas autorisé', () => {
    const next = jest.fn();
    authorize('ADMIN' as any)({ user: { id: '1', role: 'CANDIDATE' } } as any, mockRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('laisse passer un rôle autorisé', () => {
    const next = jest.fn();
    authorize('ADMIN' as any)({ user: { id: '1', role: 'ADMIN' } } as any, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('validate', () => {
  const schema = z.object({ email: z.string().email() });

  it('renvoie 400 avec le détail des erreurs si le body est invalide', () => {
    const res = mockRes();
    const next = jest.fn();
    validate(schema)({ body: { email: 'pas-un-email' } } as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('appelle next et remplace le body si valide', () => {
    const req: any = { body: { email: 'a@b.fr', extra: 1 } };
    const next = jest.fn();
    validate(schema)(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ email: 'a@b.fr' });
  });
});

describe('errorMiddleware', () => {
  it('renvoie le statut d’une AppError', () => {
    const res = mockRes();
    errorMiddleware(new AppError('Interdit', 403), {} as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('renvoie 500 pour une erreur inconnue', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    errorMiddleware(new Error('boom'), {} as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });
});

describe('notFoundMiddleware', () => {
  it('renvoie 404', () => {
    const res = mockRes();
    notFoundMiddleware({ originalUrl: '/x' } as Request, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});