import jwt from 'jsonwebtoken';

export const tokenFor = (role: 'ADMIN' | 'RECRUITER', id = 'u1') =>
  jwt.sign({ id, role }, process.env.JWT_SECRET as string);

export const bearer = (role: 'ADMIN' | 'RECRUITER') =>
  `Bearer ${tokenFor(role)}`;