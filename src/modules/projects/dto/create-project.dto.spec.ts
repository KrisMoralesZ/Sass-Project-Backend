import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

describe('CreateProjectDto', () => {
  it('trims and accepts valid project fields', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      name: '  Website redesign  ',
      description: 'Redesign the site',
      metadata: { color: 'blue' },
    });

    expect(dto.name).toBe('Website redesign');
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects blank names, oversized fields, and non-object metadata', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      name: '   ',
      description: 'x'.repeat(5001),
      metadata: ['not', 'an', 'object'],
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['name', 'description', 'metadata']),
    );
  });

  it('does not allow tenant or owner IDs in the request body', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      name: 'Website redesign',
      organizationId: 'client-controlled-org',
      ownerId: 'client-controlled-owner',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['organizationId', 'ownerId']),
    );
  });
});
