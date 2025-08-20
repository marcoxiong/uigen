import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Next.js dependencies
vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}));

// Mock jose library  
vi.mock('jose', () => ({
  SignJWT: vi.fn(),
  jwtVerify: vi.fn()
}));

import { createSession, getSession, deleteSession, verifySession } from '../auth';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

describe('auth.ts', () => {
  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';
  const mockToken = 'mock-jwt-token';

  const mockCookies = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn()
  };

  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup cookies mock
    (cookies as any).mockResolvedValue(mockCookies);
    
    // Setup SignJWT mock
    (SignJWT as any).mockImplementation(() => mockSignJWT);
    mockSignJWT.sign.mockResolvedValue(mockToken);
    
    // Reset all mocks
    mockCookies.set.mockClear();
    mockCookies.get.mockClear();
    mockCookies.delete.mockClear();
    
    // Setup environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.NODE_ENV;
  });

  describe('createSession', () => {
    it('creates a session with valid user data', async () => {
      await createSession(mockUserId, mockEmail);

      expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
      expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith('7d');
      expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();
      expect(mockSignJWT.sign).toHaveBeenCalled();

      expect(mockCookies.set).toHaveBeenCalledWith(
        'auth-token',
        mockToken,
        {
          httpOnly: true,
          secure: false, // test environment
          sameSite: 'lax',
          expires: expect.any(Date),
          path: '/'
        }
      );
    });

    it('sets secure cookie in production environment', async () => {
      process.env.NODE_ENV = 'production';

      await createSession(mockUserId, mockEmail);

      expect(mockCookies.set).toHaveBeenCalledWith(
        'auth-token',
        mockToken,
        expect.objectContaining({
          secure: true
        })
      );
    });

    it('creates session with 7-day expiration', async () => {
      const beforeTime = Date.now();
      await createSession(mockUserId, mockEmail);
      const afterTime = Date.now();

      // Check that the cookie was set with an expiration date ~7 days from now
      const setCall = mockCookies.set.mock.calls[0];
      const expires = setCall[2].expires.getTime();
      const expectedMin = beforeTime + 7 * 24 * 60 * 60 * 1000;
      const expectedMax = afterTime + 7 * 24 * 60 * 60 * 1000;

      expect(expires).toBeGreaterThanOrEqual(expectedMin);
      expect(expires).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('getSession', () => {
    it('returns session data when valid token exists', async () => {
      const mockPayload = {
        userId: mockUserId,
        email: mockEmail,
        expiresAt: new Date()
      };

      mockCookies.get.mockReturnValue({ value: mockToken });
(jwtVerify as any).mockResolvedValue({ payload: mockPayload });

      const result = await getSession();

      expect(mockCookies.get).toHaveBeenCalledWith('auth-token');
      expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.any(Object));
      expect(result).toEqual(mockPayload);
    });

    it('returns null when no token exists', async () => {
      mockCookies.get.mockReturnValue(undefined);

      const result = await getSession();

      expect(result).toBeNull();
      expect(jwtVerify).not.toHaveBeenCalled();
    });

    it('returns null when token verification fails', async () => {
      mockCookies.get.mockReturnValue({ value: mockToken });
(jwtVerify as any).mockRejectedValue(new Error('Invalid token'));

      const result = await getSession();

      expect(result).toBeNull();
    });

    it('returns null when token value is empty string', async () => {
      mockCookies.get.mockReturnValue({ value: '' });

      const result = await getSession();

      expect(result).toBeNull();
      expect(jwtVerify).not.toHaveBeenCalled();
    });
  });

  describe('deleteSession', () => {
    it('deletes the auth token cookie', async () => {
      await deleteSession();

      expect(mockCookies.delete).toHaveBeenCalledWith('auth-token');
    });
  });

  describe('verifySession', () => {
    const createMockRequest = (cookieValue?: string) => {
      const cookies = new Map();
      if (cookieValue) {
        cookies.set('auth-token', { value: cookieValue });
      }
      
      return {
        cookies: {
          get: (name: string) => cookies.get(name)
        }
      } as NextRequest;
    };

    it('returns session data when valid token exists in request', async () => {
      const mockPayload = {
        userId: mockUserId,
        email: mockEmail,
        expiresAt: new Date()
      };

      const request = createMockRequest(mockToken);
(jwtVerify as any).mockResolvedValue({ payload: mockPayload });

      const result = await verifySession(request);

      expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.any(Object));
      expect(result).toEqual(mockPayload);
    });

    it('returns null when no token exists in request', async () => {
      const request = createMockRequest();

      const result = await verifySession(request);

      expect(result).toBeNull();
      expect(jwtVerify).not.toHaveBeenCalled();
    });

    it('returns null when token verification fails', async () => {
      const request = createMockRequest(mockToken);
(jwtVerify as any).mockRejectedValue(new Error('Invalid token'));

      const result = await verifySession(request);

      expect(result).toBeNull();
    });

    it('handles malformed request cookies gracefully', async () => {
      const request = {
        cookies: {
          get: () => undefined
        }
      } as NextRequest;

      const result = await verifySession(request);

      expect(result).toBeNull();
    });
  });

  describe('JWT Secret handling', () => {
    it('uses environment JWT_SECRET when available', async () => {
      process.env.JWT_SECRET = 'custom-secret-key';
      
      await createSession(mockUserId, mockEmail);

      // Check that sign was called (the secret is internal to the module)
      expect(mockSignJWT.sign).toHaveBeenCalled();
    });

    it('uses development fallback when JWT_SECRET not set', async () => {
      delete process.env.JWT_SECRET;
      
      await createSession(mockUserId, mockEmail);

      // Check that sign was called (the secret is internal to the module)
      expect(mockSignJWT.sign).toHaveBeenCalled();
    });
  });

  describe('Session payload interface', () => {
    it('maintains correct session structure', async () => {
      await createSession(mockUserId, mockEmail);

      // Check that the cookie was set and has correct structure
      expect(mockCookies.set).toHaveBeenCalled();
      const setCall = mockCookies.set.mock.calls[0];
      
      expect(setCall[0]).toBe('auth-token');
      expect(setCall[1]).toBe(mockToken);
      expect(setCall[2]).toHaveProperty('httpOnly', true);
      expect(setCall[2]).toHaveProperty('expires');
      expect(setCall[2].expires).toBeInstanceOf(Date);
    });
  });

  describe('Error handling', () => {
    it('handles cookie setting errors gracefully', async () => {
      mockCookies.set.mockImplementation(() => {
        throw new Error('Cookie error');
      });

      await expect(createSession(mockUserId, mockEmail)).rejects.toThrow('Cookie error');
    });

    it('handles JWT signing errors gracefully', async () => {
      mockSignJWT.sign.mockRejectedValue(new Error('Signing error'));

      await expect(createSession(mockUserId, mockEmail)).rejects.toThrow('Signing error');
    });

    it('handles cookie retrieval errors in getSession', async () => {
      mockCookies.get.mockImplementation(() => {
        throw new Error('Cookie retrieval error');
      });

      await expect(getSession()).rejects.toThrow('Cookie retrieval error');
    });
  });
});