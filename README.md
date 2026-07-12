# Mike FSR Dashboard

Client-facing React dashboard for managing the DynamoDB-backed FSR routing table used after Mike's deterministic call flow emits an escalation event.

## Guardrail

This dashboard never decides whether a call escalates. It only manages destinations available after either:

1. troubleshooting reaches the deterministic Escalate result, or
2. the caller explicitly requests a human.

Sentiment remains analytics-only.

## Included

- Cognito login using the Amplify Authenticator
- IAM-signed calls to the existing API Gateway HTTP API
- List, add, edit, on-call toggle, active toggle, priority change, and archive controls
- Phone-number masking in the UI
- Sanitized local demo mode using browser storage
- Narrow IAM policy template for the Cognito authenticated role
- Amplify Hosting build file
- Exact CORS CLI template for the existing API

## Local demo

```bash
cp .env.example .env.local
npm install
npm run dev
```

The example environment enables mock mode, so it does not contact AWS.

## Production environment variables

Set these in Amplify Hosting under **Hosting → Environment variables**:

```text
VITE_USE_MOCK_API=false
VITE_API_ENDPOINT=https://v2jhgg4szi.execute-api.us-east-1.amazonaws.com/dev
VITE_API_REGION=us-east-1
VITE_API_NAME=MikeFsrAdmin
VITE_COGNITO_USER_POOL_ID=...
VITE_COGNITO_USER_POOL_CLIENT_ID=...
VITE_COGNITO_IDENTITY_POOL_ID=...
```

## Backend field mapping

The UI uses canonical fields and maps them to the Lambda payload in:

```text
src/config/apiFields.ts
```

The starter assumes:

```text
kit_id
route_order
fsr_name
phone_number
active
on_call
archived
```

Before turning off mock mode, compare those names to the tested `mike-fsr-admin-api` Lambda. Change only `src/config/apiFields.ts` if the Lambda uses a different display-name or phone attribute.

## Important priority note

`route_order` is the DynamoDB sort key. A sort key cannot be changed by a normal DynamoDB UpdateItem call. The dashboard blocks swaps between two occupied priority numbers until the Lambda explicitly supports an atomic reorder operation. Moving a route into an unused priority is sent through PATCH and must also be supported by the Lambda's path-handling logic.

## AWS sequence

1. Create Cognito user pool with self-service sign-up disabled.
2. Create a public app client without a client secret.
3. Create an identity pool linked to the user pool and app client; disable guest access.
4. Attach `infra/authenticated-route-policy.json` to the identity pool's authenticated IAM role.
5. Create initial dashboard users in Cognito.
6. Push this project to a Git repository and connect it to Amplify Hosting.
7. Add the production environment variables in Amplify.
8. After Amplify assigns the domain, configure API Gateway CORS for that exact origin.
9. Redeploy the `dev` API stage because auto-deploy is off.
10. Test all four operations while signed in.
