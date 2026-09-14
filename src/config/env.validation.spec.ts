import 'reflect-metadata';
import { validate } from './env.validation';

const validEnv = {
  NODE_ENV: 'test',
  PORT: 3000,
  DATABASE_HOST: 'localhost',
  DATABASE_PORT: 5432,
  DATABASE_USER: 'postgres',
  DATABASE_PASSWORD: 'postgres',
  DATABASE_NAME: 'sass',
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  DATABASE_SSL: 'true',
};

describe('validate', () => {
  it('returns the coerced environment when required vars are present', () => {
    const result = validate(validEnv);

    expect(result.NODE_ENV).toBe('test');
    expect(result.DATABASE_HOST).toBe('localhost');
    expect(result.DATABASE_SSL).toBe(true);
  });

  it('throws when required variables are missing', () => {
    expect(() => validate({})).toThrow(Error);
  });
});
