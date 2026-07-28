import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './libs/database/schema.ts',
  out: './drizzle',
});
