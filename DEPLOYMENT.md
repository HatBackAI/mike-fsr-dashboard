# AWS Console Deployment Walkthrough

## 1. User pool

Amazon Cognito → User pools → Create user pool

- Application type: Traditional web application
- Sign-in options: Email
- Self-registration: Disabled
- MFA: Optional for pilot; required before production if GovCIO policy calls for it
- Password policy: Cognito defaults or stricter
- Email provider: Cognito for pilot
- Pool name: `mike-dashboard-users`

Create an app client with:

- Client type: Public client
- Client secret: Do not generate
- Authentication flows: SRP and refresh-token flow
- Hosted UI: not required for the embedded Amplify Authenticator

Record the User pool ID and App client ID.

## 2. Identity pool

Amazon Cognito → Identity pools → Create identity pool

- Name: `mike-dashboard-identities`
- Authenticated access: enabled
- Guest access: disabled
- Authentication provider: Amazon Cognito user pool
- Supply the User pool ID and App client ID
- Create a new authenticated IAM role named similar to `mike-dashboard-authenticated-role`

After creation, open the authenticated IAM role and add an inline policy using:

`infra/authenticated-route-policy.json`

Do not attach the policy to the unauthenticated role.

Record the Identity pool ID.

## 3. Create the first user

Amazon Cognito → User pools → `mike-dashboard-users` → Users → Create user

- Enter the approved administrator email
- Send an invitation or set a temporary password
- Keep self-registration disabled

## 4. Amplify Hosting

AWS Amplify → Create new app → Host web app

- Connect the Git repository containing this project
- Build settings should be detected from `amplify.yml`
- Add the production environment variables from `.env.example`
- Deploy

## 5. API Gateway CORS

API Gateway → APIs → `mike-fsr-admin-api` → CORS

Allowed origin:

- Exact Amplify production origin, such as `https://main.xxxxx.amplifyapp.com`

Allowed methods:

- GET
- POST
- PATCH
- DELETE
- OPTIONS

Allowed headers:

- authorization
- content-type
- x-amz-date
- x-amz-security-token
- x-api-key

Max age:

- 300

Save, then deploy the `dev` stage because auto-deploy is off.

## 6. Acceptance test

- Sign in with a Cognito-created user
- Confirm GET lists only the production `DEFAULT` routes
- Add a sanitized test route under a dedicated temporary kit
- Edit its name and phone number
- Toggle on-call off and on
- Toggle active off and on
- Move priority only into an unused route_order unless the Lambda supports atomic swaps
- Archive it and confirm it no longer appears
- Confirm the real DEFAULT destinations remain unchanged
