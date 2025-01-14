import { user, blacklistedToken } from "#models/index.js";

export const dataAccess = {
  createUser: async (name, email, hashedPassword) =>
    await user.create({
      data: { name, email, password: hashedPassword },
    }),
  findUserByEmail: async (email) =>
    await user.findUnique({
      where: { email },
    }),
  fetchAllUsers: async () => await user.findMany(),
  findUserById: async (id) =>
    await user.findUnique({
      where: { id: userId },
    }),
  updateUserById: async (id, userData) =>
    await user.update({
      where: { id: userId },
      data: userData,
    }),
  deleteUserById: async (id) =>
    await user.delete({
      where: { id: userId },
    }),
  createBlacklistedToken: async (token, expiresAt, userId) => {
    return await blacklistedToken.create({
      data: {
        token,
        expiresAt,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  },
  findBlacklistedToken: async (token) => {
    return await blacklistedToken.findUnique({
      where: { token },
    });
  },
};
