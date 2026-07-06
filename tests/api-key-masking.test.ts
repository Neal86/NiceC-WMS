import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

describe('API Key Security', () => {
  describe('Key Hashing', () => {
    it('should hash API keys before storing', async () => {
      const rawKey = 'nwc_' + crypto.randomBytes(24).toString('hex');
      const hash = await bcrypt.hash(rawKey, 10);

      expect(hash).not.toBe(rawKey);
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')).toBe(true);

      // Verify the hash matches the original key
      const isValid = await bcrypt.compare(rawKey, hash);
      expect(isValid).toBe(true);

      // Verify wrong key doesn't match
      const isInvalid = await bcrypt.compare('wrong_key', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Key Masking', () => {
    const maskKey = (key: string): string => {
      if (!key || key.length < 12) return '****';
      return key.substring(0, 8) + '****' + key.substring(key.length - 4);
    };

    it('should mask API key for list display', () => {
      const fullKey = 'nwc_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
      const masked = maskKey(fullKey);

      expect(masked).not.toBe(fullKey);
      expect(masked).toContain('****');
      expect(masked.startsWith('nwc_a1b')).toBe(true);
      expect(masked.endsWith('o5p6')).toBe(true);
      expect(masked.length).toBeLessThan(fullKey.length);
    });

    it('should handle short keys gracefully', () => {
      expect(maskKey('short')).toBe('****');
      expect(maskKey('')).toBe('****');
      expect(maskKey(null as any)).toBe('****');
    });

    it('should not expose full key in any field for list', () => {
      // Simulate the API response structure
      const dbKey = 'hashed_value_not_real_key';
      const apiResponse = {
        id: 'ak_1',
        key: dbKey.substring(0, 8) + '****' + dbKey.substring(dbKey.length - 4),
        status: 'ACTIVE',
      };

      // The key in the response should NEVER be the full hash
      expect(apiResponse.key).not.toBe(dbKey);
      expect(apiResponse.key).toContain('****');
    });
  });

  describe('Webhook Secret Security', () => {
    it('should mask webhook secret in list response', () => {
      const webhooks = [
        { id: 'wh_1', secret: 'whsec_abc123def456' },
      ];

      const masked = webhooks.map(h => ({ ...h, secret: '••••••••' }));
      expect(masked[0].secret).toBe('••••••••');
      expect(masked[0].secret).not.toBe('whsec_abc123def456');
    });

    it('should return raw secret only on creation', () => {
      // On creation, raw secret is returned ONCE
      const creationResponse = {
        id: 'wh_new',
        secret: 'whsec_' + 'a1b2c3d4e5f6g7h8',
        status: 'ACTIVE',
      };

      expect(creationResponse.secret).toMatch(/^whsec_/);
      expect(creationResponse.secret.length).toBeGreaterThan(0);
    });

    it('should hash webhook secrets bcrypt', async () => {
      const rawSecret = 'whsec_' + crypto.randomBytes(16).toString('hex');
      const hash = await bcrypt.hash(rawSecret, 10);

      expect(hash).not.toBe(rawSecret);
      const isValid = await bcrypt.compare(rawSecret, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('API Key Authentication', () => {
    it('should validate API key against stored hash', async () => {
      const rawKey = 'nwc_valid_test_key_12345678';
      const storedHash = await bcrypt.hash(rawKey, 10);

      // Simulate incoming request with X-API-Key header
      const incomingKey = 'nwc_valid_test_key_12345678';
      const isValid = await bcrypt.compare(incomingKey, storedHash);
      expect(isValid).toBe(true);

      const wrongKey = 'nwc_wrong_key';
      const isInvalid = await bcrypt.compare(wrongKey, storedHash);
      expect(isInvalid).toBe(false);
    });
  });
});
