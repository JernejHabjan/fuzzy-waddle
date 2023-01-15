import { Environment } from './environment-type';

export const environment: Environment = {
  production: true,
  api: process.env['API_URL'] || 'http://setup-via-env-variable/'
};
