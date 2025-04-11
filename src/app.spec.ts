import { TokenBundle, TokenBundleVerification } from '@veraid/kliento';
import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import app, { CONTENT_TYPES } from './app.js';
import { STATUS_CODES } from './utils/http.js';

const AUDIENCE = 'https://api.example.com';
const QUERY_STRING = {
  audience: AUDIENCE,
};

const CLAIMS = {
  foo: 'bar',
};
const SUBJECT = 'alice@example.com';

const TOKEN_BUNDLE_VERIFICATION: TokenBundleVerification = {
  claims: CLAIMS,
  subjectId: SUBJECT,
};

const TOKEN_BUNDLE = Buffer.from('The token bundle');
const TOKEN_BUNDLE_AUTH_HEADER = `Kliento ${TOKEN_BUNDLE.toString('base64')}`;

const DESERIALISE_SPY = vi.spyOn(TokenBundle, 'deserialise');
const DESERIALISE_AUTH_HEADER_SPY = vi.spyOn(TokenBundle, 'deserialiseFromAuthHeader');

beforeEach(() => {
  DESERIALISE_SPY.mockReset();
  DESERIALISE_AUTH_HEADER_SPY.mockReset();
});

describe('Kliento token bundle verification', () => {
  const client = testClient(app);

  it('should refuse request without an audience in the query string', async () => {
    const response = await client.index.$post({
      body: TOKEN_BUNDLE,
    });

    expect(response.status).toBe(STATUS_CODES.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      error: 'Audience is missing from the query string',
    });
    expect(DESERIALISE_SPY).not.toHaveBeenCalled();
  });

  describe('Deserialisation', () => {
    it('should assume binary token bundle in the absence of a content type', async () => {
      const mockTokenBundle = {
        verify: vi.fn().mockResolvedValue(TOKEN_BUNDLE_VERIFICATION),
      } as unknown as TokenBundle;

      DESERIALISE_SPY.mockReturnValueOnce(mockTokenBundle);

      await client.index.$post({
        body: TOKEN_BUNDLE,
        query: QUERY_STRING,
      });

      expect(DESERIALISE_SPY).toHaveBeenCalled();
      expect(DESERIALISE_AUTH_HEADER_SPY).not.toHaveBeenCalled();
    });

    it('should refuse request with unrecognised content type', async () => {
      const response = await app.request(`/?audience=${AUDIENCE}`, {
        body: TOKEN_BUNDLE,
        headers: {
          'content-type': 'text/plain',
        },
        method: 'POST',
      });

      expect(response.status).toBe(STATUS_CODES.UNSUPPORTED_MEDIA_TYPE);
      await expect(response.json()).resolves.toEqual({
        error: 'Unrecognised content type',
      });
      expect(DESERIALISE_SPY).not.toHaveBeenCalled();
    });

    it('should set status=malformed if input should be bundle but is malformed', async () => {
      const error = new Error('Malformed token bundle');

      DESERIALISE_SPY.mockImplementationOnce(() => {
        throw error;
      });

      const response = await client.index.$post({
        body: TOKEN_BUNDLE,
        query: QUERY_STRING,
      });

      expect(response.status).toBe(STATUS_CODES.OK);
      await expect(response.json()).resolves.toEqual({
        error: error.message,
        status: 'malformed',
      });
    });

    it('should set status=malformed if input is malformed Authorization header', async () => {
      const error = new Error('Malformed Authorization header value');

      DESERIALISE_AUTH_HEADER_SPY.mockImplementationOnce(() => {
        throw error;
      });

      const headers = {
        'content-type': CONTENT_TYPES.AUTH_HEADER,
      };

      const response = await app.request(`/?audience=${AUDIENCE}`, {
        body: TOKEN_BUNDLE_AUTH_HEADER,
        headers,
        method: 'POST',
      });

      expect(response.status).toBe(STATUS_CODES.OK);
      await expect(response.json()).resolves.toEqual({
        error: error.message,
        status: 'malformed',
      });
    });
  });

  describe('Verification', () => {
    it('should set status=invalid if token bundle is well-formed but invalid', async () => {
      const error = new Error('Invalid token bundle');
      const mockTokenBundle = {
        verify: vi.fn().mockRejectedValue(error),
      } as unknown as TokenBundle;

      DESERIALISE_SPY.mockReturnValueOnce(mockTokenBundle);

      const response = await client.index.$post({
        body: TOKEN_BUNDLE,
        query: QUERY_STRING,
      });

      expect(response.status).toBe(STATUS_CODES.OK);
      await expect(response.json()).resolves.toEqual({
        error: error.message,
        status: 'invalid',
      });
    });

    it('should verify the bundle with the specified audience', async () => {
      const mockTokenBundle = {
        verify: vi.fn().mockResolvedValue(TOKEN_BUNDLE_VERIFICATION),
      } as unknown as TokenBundle;

      DESERIALISE_SPY.mockReturnValueOnce(mockTokenBundle);

      await client.index.$post({
        body: TOKEN_BUNDLE,
        query: QUERY_STRING,
      });

      expect(mockTokenBundle.verify).toHaveBeenCalledWith(AUDIENCE);
    });

    it('should return verification result if input is valid token bundle', async () => {
      DESERIALISE_SPY.mockReturnValueOnce({
        verify: vi.fn().mockResolvedValue(TOKEN_BUNDLE_VERIFICATION),
      } as unknown as TokenBundle);

      const response = await client.index.$post({
        body: TOKEN_BUNDLE,
        query: QUERY_STRING,
      });

      expect(response.status).toBe(STATUS_CODES.OK);
      await expect(response.json()).resolves.toEqual({
        claims: CLAIMS,
        status: 'valid',
        subject: SUBJECT,
      });
    });

    it('should return verification result if input is valid Authorization header', async () => {
      DESERIALISE_AUTH_HEADER_SPY.mockReturnValueOnce({
        verify: vi.fn().mockResolvedValue(TOKEN_BUNDLE_VERIFICATION),
      } as unknown as TokenBundle);

      const headers = new Headers([['Content-Type', CONTENT_TYPES.AUTH_HEADER]]);

      const response = await app.request(`/?audience=${AUDIENCE}`, {
        body: TOKEN_BUNDLE_AUTH_HEADER,
        headers,
        method: 'POST',
      });

      expect(response.status).toBe(STATUS_CODES.OK);
      await expect(response.json()).resolves.toEqual({
        claims: CLAIMS,
        status: 'valid',
        subject: SUBJECT,
      });
    });
  });
});
