import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StaffTokenService, type StaffTokenClaims } from './staff-token.service';

export const STAFF_PERMISSION_KEY = 'staff_permission';
export const RequireStaffPermission = (permission: string) =>
  SetMetadata(STAFF_PERMISSION_KEY, permission);

export const OPTIONAL_STAFF = 'optional_staff';
export const OptionalStaff = () => SetMetadata(OPTIONAL_STAFF, true);

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: StaffTokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const optional = this.reflector.getAllAndOverride<boolean>(OPTIONAL_STAFF, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      staff?: StaffTokenClaims;
    }>();

    const header =
      req.headers['x-staff-token'] ||
      req.headers['authorization'] ||
      req.headers['Authorization'];

    if (!header) {
      if (optional) return true;
      throw new UnauthorizedException('Staff authentication required');
    }

    const claims = this.tokens.verify(header);
    await this.tokens.assertActive(claims);
    const need = this.reflector.getAllAndOverride<string>(STAFF_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (need) this.tokens.requirePermission(claims, need);
    req.staff = claims;
    return true;
  }
}
