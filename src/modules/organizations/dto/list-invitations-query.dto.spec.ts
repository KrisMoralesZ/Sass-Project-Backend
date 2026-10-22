import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SortOrder } from '@common/enums/sort-order.enum';
import { ListInvitationsQueryDto } from './list-invitations-query.dto';

function validate(payload: Record<string, unknown>) {
  return validateSync(plainToInstance(ListInvitationsQueryDto, payload));
}

describe('ListInvitationsQueryDto', () => {
  it('accepts an empty query and defaults the sort order', () => {
    const dto = plainToInstance(ListInvitationsQueryDto, {});

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.sortOrder).toBe(SortOrder.DESC);
    expect(dto.status).toBeUndefined();
  });

  it.each(['pending', 'accepted', 'revoked', 'expired'] as const)(
    'accepts the %s status filter',
    (status) => {
      expect(validate({ status })).toHaveLength(0);
    },
  );

  it('rejects an unknown status filter', () => {
    const errors = validate({ status: 'cancelled' });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('status');
  });
});
