import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({ where: { email } });
};

export { findUserByEmail };
