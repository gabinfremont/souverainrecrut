import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const mockFindByEmail = jest.fn();

jest.mock('../src/repositories/user.repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findByEmail: mockFindByEmail,
  })),
}));

import { AuthService } from '../src/services/auth.service';

describe('AuthService.login', () => {
  const service = new AuthService();
  const user = {
    id: 'u1',
    email: 'a@b.fr',
    role: 'ADMIN',
    password: bcrypt.hashSync('secret123', 4),
  };

  beforeEach(() => mockFindByEmail.mockReset());

  it('renvoie un token et un utilisateur sans mot de passe', async () => {
    mockFindByEmail.mockResolvedValue(user);

    const result = await service.login('a@b.fr', 'secret123');

    expect(result.user).not.toHaveProperty('password');
    const decoded: any = jwt.verify(result.token, process.env.JWT_SECRET as string);
    expect(decoded).toMatchObject({ id: 'u1', role: 'ADMIN' });
  });

  it('refuse un email inconnu (401)', async () => {
    mockFindByEmail.mockResolvedValue(null);
    await expect(service.login('x@y.fr', 'secret123')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('refuse un mauvais mot de passe (401)', async () => {
    mockFindByEmail.mockResolvedValue(user);
    await expect(service.login('a@b.fr', 'mauvais')).rejects.toMatchObject({ statusCode: 401 });
  });
});