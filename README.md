# HTTP server to verify Kliento token bundles

This is a trivial HTTP server that verifies [Kliento](https://veraid.net/kliento/) token bundles.

This app doesn't have any backing services (e.g. DB server).

This app is already packaged as a Docker image in [`CheVeraId/kliento-verifier-docker`](https://github.com/CheVeraId/kliento-verifier-docker).

## Installation

The app is available as a Hono server in the [NPM package `@veraid/kliento-verifier`](https://www.npmjs.com/package/@veraid/kliento-verifier), as the default export of the package.

Refer to the [Hono documentation](https://hono.dev/docs/) for instructions on how to integrate it into your runtime (e.g. Deno, AWS Lambda). For example, this is how the app can run on Node.js:

```ts
import { serve } from '@hono/node-server';
import klientoVerifier from '@veraid/kliento-verifier';

serve({ fetch: klientoVerifier.fetch, port: 3000 });
```

## Usage

Simply make a `POST /` request to the server with the token bundle in the body and the expected audience in the query string.

For example, to verify a token bundle in the file `token.bundle` with the audience `https://api.example.com`, you could use `curl` as follows:

```bash
curl \
  --request POST \
  --data @token.bundle \
  'http://localhost:3000/?audience=https%3A%2F%2Fapi.example.com'
```

Alternatively, to verify a token bundle in an `Authorization` request header, you should set the request `Content-Type` to `application/vnd.kliento.auth-header`. For example:

```bash
curl \
  --request POST \
  --header 'Content-Type: application/vnd.kliento.auth-header' \
  --data 'Kliento <TOKEN-BUNDLE-BASE64>' \
  'http://localhost:3000/?audience=https%3A%2F%2Fapi.example.com'
```

## HTTP responses

The endpoint returns the following HTTP responses in JSON format:

### Successful verification (HTTP 200)

```json
{
  "status": "valid",
  "subject": {
    "organisation": "example.com",
    "user": "alice"
  },
  "claims": {
    "claim1": "value1"
  }
}
```

Note that `subject.user` will be `undefined` when the token is attributed to the organisation and `claims` may be empty.

### Malformed token bundle (HTTP 200)

```json
{
  "error": "Error message",
  "status": "malformed"
}
```

### Invalid token bundle (HTTP 200)

```json
{
  "error": "Error message",
  "status": "invalid"
}
```

### Missing audience (HTTP 400)

```json
{
  "error": "Audience is missing from the query string"
}
```

### Unrecognised request content type (HTTP 415)

```json
{
  "error": "Unrecognised content type"
}
```

## Contributions

We love contributions! If you haven't contributed to a Relaycorp project before, please take a minute to [read our guidelines](https://github.com/relaycorp/.github/blob/master/CONTRIBUTING.md) first.

Issues are tracked on the [`KLIB` project on Jira](https://relaycorp.atlassian.net/browse/KLIB).
