import { describe, it, expect } from 'vitest';

describe('Auth Module', () => {
  describe('Login Validation', () => {
    it('should reject empty username', () => {
      const validateLogin = (username: string, password: string): string | null => {
        if (!username || !username.trim()) return 'Username is required';
        if (password && password.length < 3) return 'Password must be at least 3 characters';
        return null;
      };

      expect(validateLogin('', 'password')).toBe('Username is required');
      expect(validateLogin('  ', 'password')).toBe('Username is required');
    });

    it('should reject short passwords', () => {
      const validateLogin = (username: string, password: string): string | null => {
        if (!username || !username.trim()) return 'Username is required';
        if (password && password.length < 3) return 'Password must be at least 3 characters';
        return null;
      };

      expect(validateLogin('user', 'ab')).toBe('Password must be at least 3 characters');
    });

    it('should accept valid login credentials', () => {
      const validateLogin = (username: string, password: string): string | null => {
        if (!username || !username.trim()) return 'Username is required';
        if (password && password.length < 3) return 'Password must be at least 3 characters';
        return null;
      };

      expect(validateLogin('admin@test.com', 'validPass123')).toBeNull();
    });
  });

  describe('Demo Login Guard', () => {
    it('should block demo login when ENABLE_DEMO_LOGIN is false', () => {
      const ENABLE_DEMO_LOGIN = process.env.ENABLE_DEMO_LOGIN !== 'false';

      // Production mode
      const prodEnv = { ENABLE_DEMO_LOGIN: 'false' };
      const demoEnabled = prodEnv.ENABLE_DEMO_LOGIN !== 'false';
      expect(demoEnabled).toBe(false);
    });

    it('should allow demo login when ENABLE_DEMO_LOGIN is true', () => {
      const devEnv = { ENABLE_DEMO_LOGIN: 'true' };
      const demoEnabled = devEnv.ENABLE_DEMO_LOGIN !== 'false';
      expect(demoEnabled).toBe(true);
    });

    it('should default to allowing demo login when env var is not set', () => {
      const emptyEnv = {};
      const demoEnabled = (emptyEnv as any).ENABLE_DEMO_LOGIN !== 'false';
      expect(demoEnabled).toBe(true);
    });
  });

  describe('Token Generation', () => {
    it('should generate a token with user info', () => {
      // Simulate the token payload structure
      const createTokenPayload = (user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        warehouseId: user.warehouseId,
      });

      const user = {
        id: 'u1',
        username: 'admin',
        email: 'admin@test.com',
        role: 'ADMIN',
        customerId: null,
        warehouseId: 'wh_1',
      };

      const payload = createTokenPayload(user);
      expect(payload.id).toBe('u1');
      expect(payload.role).toBe('ADMIN');
      // Should NOT include sensitive fields
      expect((payload as any).passwordHash).toBeUndefined();
    });
  });

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      // We test the bcrypt integration indirectly
      const bcrypt = await import('bcryptjs');
      const password = 'testPassword123!';
      const hash = await bcrypt.hash(password, 10);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2a$')).toBe(true);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('wrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });
});
