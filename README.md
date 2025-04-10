# HTTP server to verify Kliento token bundles

This is a trivial HTTP server that verifies [Kliento](https://veraid.net/kliento/) token bundles.

## Installation

### NPM package

The app is available as a Hono server in the [NPM package `@veraid/kliento-verifier`](https://www.npmjs.com/package/@veraid/kliento-verifier). The app is the default export of the package.

Refer to the [Hono documentation](https://hono.dev/docs/) for instructions on how to integrate it into your runtime (e.g. Deno, AWS Lambda). For example, this is how the app can run on Node.js:

```ts
import { serve } from '@hono/node-server';
import klientoVerifier from '@veraid/kliento-verifier';

serve({ fetch: klientoVerifier.fetch, port: 3000 });
```

## Usage

Simply make a `POST /` request to the server with the token bundle in the body and the expected audience in the query string. For example, to verify a token bundle in the file `token-bundle-file` with the audience `https://api.example.com`, you could use `curl` as follows:

```bash
curl \
  -X POST \
  -d @token-bundle-file \
  "http://localhost:3000/?audience=https%3A%2F%2Fapi.example.com"
```

Alternatively, to verify a token bundle in an Authorization request header, you should set the request `Content-Type` to `application/vnd.kliento.auth-header`. For example:

```bash
curl \
  -X POST \
  -H "Content-Type: application/vnd.kliento.auth-header" \
  -d @token-bundle-file \
  "http://localhost:3000/?audience=https%3A%2F%2Fapi.example.com"
```

## Contributions

We love contributions! If you haven't contributed to a Relaycorp project before, please take a minute to [read our guidelines](https://github.com/relaycorp/.github/blob/master/CONTRIBUTING.md) first.

Issues are tracked on the [`KLIB` project on Jira](https://relaycorp.atlassian.net/browse/KLIB).
