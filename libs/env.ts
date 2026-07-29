export type Environment = 'development' | 'preview' | 'production';

export const getEnvironment = (): Environment => {
  // On Vercel, VERCEL_ENV is the most accurate
  // Fallback to NODE_ENV for local development
  return process.env.NEXT_PUBLIC_VERCEL_ENV
    ? (process.env.NEXT_PUBLIC_VERCEL_ENV as Environment)
    : process.env.NODE_ENV === 'production'
      ? 'production'
      : 'development';
};

const env = getEnvironment();

export const isProdEnv = env === 'production';
export const isPreviewEnv = env === 'preview';
export const isDevEnv = env === 'development';
export const isPreProductionEnv = !isProdEnv;
