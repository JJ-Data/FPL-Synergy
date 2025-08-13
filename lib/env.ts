// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Admin
  ADMIN_PASSWORD: z
    .string()
    .min(8, "ADMIN_PASSWORD must be at least 8 characters"),

  // App settings
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Optional settings
  RATE_LIMIT_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes

  // FPL API settings
  FPL_API_TIMEOUT_MS: z.coerce.number().default(10000),
  FPL_CACHE_TTL_SECONDS: z.coerce.number().default(300),
});

type EnvConfig = z.infer<typeof envSchema>;

let env: EnvConfig;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error("❌ Invalid environment configuration:");
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(`  ${err.path.join(".")}: ${err.message}`);
    });
  }
  process.exit(1);
}

export { env };

// Environment checks for different runtime contexts
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(
        ...error.errors.map((err) => `${err.path.join(".")}: ${err.message}`)
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Create .env.example content
export const envExample = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fpl_challenge"

# Admin Configuration
ADMIN_PASSWORD="your-secure-admin-password-here"

# Environment
NODE_ENV="development"

# Optional Rate Limiting (defaults shown)
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Optional FPL API Settings (defaults shown)
FPL_API_TIMEOUT_MS=10000
FPL_CACHE_TTL_SECONDS=300`;

// Utility to check if all required environment variables are set
export function getEnvironmentStatus() {
  const validation = validateEnvironment();

  return {
    isValid: validation.valid,
    errors: validation.errors,
    environment: env.NODE_ENV,
    hasDatabase: !!env.DATABASE_URL,
    hasAdminPassword: !!env.ADMIN_PASSWORD,
    config: {
      rateLimitRequests: env.RATE_LIMIT_REQUESTS,
      rateLimitWindow: env.RATE_LIMIT_WINDOW_MS,
      fplTimeout: env.FPL_API_TIMEOUT_MS,
      fplCacheTtl: env.FPL_CACHE_TTL_SECONDS,
    },
  };
}
