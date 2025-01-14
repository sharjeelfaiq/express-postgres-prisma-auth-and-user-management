import { createError } from "#packages/index.js";
import { utility } from "#utility/index.js";
import { dataAccess } from "#dataAccess/index.js";

const {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  handleError,
} = utility;

const { createUser, findUserByEmail, createBlacklistedToken } = dataAccess;

export const AuthService = {
  signUp: async ({ name, email, password }) => {
    try {
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        throw createError(400, "User with the provided email already exists");
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await createUser(name, email, hashedPassword);

      const token = generateToken(newUser.id);

      const result = {
        email: newUser.email,
        role: newUser.role,
        token,
      };

      return result;
    } catch (error) {
      return handleError(error, "Failed to sign up user");
    }
  },
  signIn: async ({ email, password, isRemembered }) => {
    try {
      const existingUser = await findUserByEmail(email);
      if (!existingUser) throw createError(401, "Invalid credentials");

      const isValid = await comparePassword(password, existingUser.password);
      if (!isValid) throw createError(401, "Invalid credentials");

      const token = generateToken(isRemembered, existingUser.id);

      const result = {
        email: existingUser.email,
        role: existingUser.role,
        token,
      };

      return result;
    } catch (error) {
      return handleError(error, "Failed to sign in user");
    }
  },
  signOut: async ({ token }) => {
    try {
      const userId = await verifyToken(token);
      const expiresAt = new Date(new Date().getTime() + 60 * 60 * 1000);
      const blacklistedToken = await createBlacklistedToken(
        token,
        expiresAt,
        userId
      );

      return "Successfully signed out";
    } catch (error) {
      return handleError(error, "Failed to sign out user");
    }
  },
};
