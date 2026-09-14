import { isUserAdmin, isUserOwner, isUserRenter, KrenterUser } from './auth.service';

describe('Auth Service Role Helpers', () => {
  it('should identify krenterservices@gmail.com as admin', () => {
    const user: KrenterUser = {
      uid: 'admin-1',
      name: 'Krenter Admin',
      email: 'krenterservices@gmail.com',
      createdAt: new Date(),
    };
    expect(isUserAdmin(user)).toBe(true);
  });

  it('should identify user with role "admin" as admin', () => {
    const user: KrenterUser = {
      uid: 'admin-2',
      name: 'Custom Admin',
      email: 'custom.admin@example.com',
      role: 'admin',
      createdAt: new Date(),
    };
    expect(isUserAdmin(user)).toBe(true);
  });

  it('should identify user with roles array containing "admin" as admin', () => {
    const user: KrenterUser = {
      uid: 'admin-3',
      name: 'Multi Role Admin',
      email: 'multi@example.com',
      roles: ['owner', 'admin'],
      createdAt: new Date(),
    };
    expect(isUserAdmin(user)).toBe(true);
    expect(isUserOwner(user)).toBe(true);
  });

  it('should not identify regular renters or owners as admin', () => {
    const renter: KrenterUser = {
      uid: 'renter-1',
      name: 'Regular Renter',
      email: 'renter@example.com',
      role: 'renter',
      roles: ['renter'],
      createdAt: new Date(),
    };
    expect(isUserAdmin(renter)).toBe(false);
    expect(isUserRenter(renter)).toBe(true);
  });

  it('should handle null and undefined safely', () => {
    expect(isUserAdmin(null)).toBe(false);
    expect(isUserAdmin(undefined)).toBe(false);
  });
});
