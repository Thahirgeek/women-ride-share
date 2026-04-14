import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const authBaseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;

export const auth = betterAuth({
  baseURL: authBaseURL,
  secret: authSecret,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "PASSENGER",
        input: true,
      },
      gender: {
        type: "string",
        required: false,
        defaultValue: "OTHER",
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      profileImage: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
