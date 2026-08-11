// Local app has one environment. `isDevEnv` gates developer-only surfaces (the
// project backfill route + Developer tab) on `NODE_ENV !== 'production'` so they
// show during `bun dev` and hide from a production build.
export const isDevEnv = process.env.NODE_ENV !== 'production';