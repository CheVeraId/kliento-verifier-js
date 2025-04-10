import { TokenBundle, TokenBundleVerification } from '@veraid/kliento';
import { Context, Hono } from 'hono';

import { STATUS_CODES } from './utils/http.js';

export const CONTENT_TYPES = {
  AUTH_HEADER: 'application/vnd.kliento.auth-header',
  TOKEN_BUNDLE: 'application/vnd.kliento.token-bundle',
} as const;

async function deserialiseTokenBundle(context: Context): Promise<Response | TokenBundle> {
  const contentType = context.req.header('content-type');

  if (!contentType || contentType === CONTENT_TYPES.TOKEN_BUNDLE) {
    const body = await context.req.arrayBuffer();

    try {
      return TokenBundle.deserialise(body);
    } catch (error) {
      return context.json(
        { error: (error as Error).message, status: 'malformed' },
        STATUS_CODES.OK,
      );
    }
  }

  if (contentType === CONTENT_TYPES.AUTH_HEADER) {
    const body = await context.req.text();

    try {
      return TokenBundle.deserialiseFromAuthHeader(body);
    } catch (error) {
      return context.json(
        { error: (error as Error).message, status: 'malformed' },
        STATUS_CODES.OK,
      );
    }
  }

  return context.json({ error: 'Unrecognised content type' }, STATUS_CODES.UNSUPPORTED_MEDIA_TYPE);
}

const app = new Hono().post('/', async (context) => {
  const audience = context.req.query('audience');

  if (!audience) {
    return context.json(
      { error: 'Audience is missing from the query string' },
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const tokenBundle = await deserialiseTokenBundle(context);

  if (tokenBundle instanceof Response) {
    return tokenBundle;
  }

  let result: TokenBundleVerification;

  try {
    result = await tokenBundle.verify(audience);
  } catch (error) {
    return context.json({ error: (error as Error).message, status: 'invalid' }, STATUS_CODES.OK);
  }

  return context.json({
    claims: result.claims,
    status: 'valid',
    subject: result.subject,
  });
});

export default app;
