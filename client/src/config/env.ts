import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_API_TIMEOUT: z.string().transform(Number),
  VITE_ENABLE_ANALYTICS: z.string().transform((v) => v === "true"),
  VITE_AUTH_STORAGE_KEY: z.string(),
  VITE_SESSION_DURATION: z.string().transform(Number),
});

function validateEnv() {
  const parsed = envSchema.safeParse({
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
    VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
    VITE_AUTH_STORAGE_KEY: import.meta.env.VITE_AUTH_STORAGE_KEY,
    VITE_SESSION_DURATION: import.meta.env.VITE_SESSION_DURATION,
  });

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      JSON.stringify(parsed.error.format(), null, 2)
    );
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = validateEnv();
