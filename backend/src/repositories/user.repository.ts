import { Prisma, User } from "@prisma/client";

import { prisma } from "../config/prisma";

/**
 * Champs exposés par l'API : jamais le mot de passe.
 */
const publicUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
});

export type PublicUser = Omit<User, "password">;

export class UserRepository {
  /**
   * Retourne les utilisateurs paginés (sans mot de passe).
   */
  async findAll(skip = 0, take = 10) {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
        select: publicUserSelect,
      }),

      prisma.user.count(),
    ]);

    return {
      items,
      total,
    };
  }

  /**
   * Retourne un utilisateur par son identifiant (sans mot de passe).
   */
  async findById(id: string): Promise<PublicUser | null> {
    return prisma.user.findUnique({
      where: {
        id,
      },
      select: publicUserSelect,
    });
  }

  /**
   * Retourne un utilisateur par son email, AVEC son mot de passe haché.
   * Réservé à l'authentification et au contrôle d'unicité.
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  /**
   * Retourne le profil d'un utilisateur
   * sans exposer son mot de passe.
   */
  async findProfile(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      },
      select: publicUserSelect,
    });
  }

  /**
   * Crée un utilisateur (réponse sans mot de passe).
   */
  async create(data: Prisma.UserCreateInput): Promise<PublicUser> {
    return prisma.user.create({
      data,
      select: publicUserSelect,
    });
  }

  /**
   * Met à jour un utilisateur (réponse sans mot de passe).
   */
  async update(
    id: string,
    data: Prisma.UserUpdateInput
  ): Promise<PublicUser> {
    return prisma.user.update({
      where: {
        id,
      },
      data,
      select: publicUserSelect,
    });
  }

  /**
   * Supprime un utilisateur (réponse sans mot de passe).
   */
  async delete(id: string): Promise<PublicUser> {
    return prisma.user.delete({
      where: {
        id,
      },
      select: publicUserSelect,
    });
  }
}