import { Environment } from './environment-type';

export const environment: Environment = {
  production: true,
  api: process.env['API_URL'] || 'https://fuzzy-waddle-api-production.up.railway.app/'
};
