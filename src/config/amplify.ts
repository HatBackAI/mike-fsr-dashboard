import { Amplify } from 'aws-amplify';

export const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';

const required = (name: keyof ImportMetaEnv): string => {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export function configureAmplify(): void {
  if (useMockApi) return;

  const region = import.meta.env.VITE_API_REGION ?? 'us-east-1';
  const apiName = import.meta.env.VITE_API_NAME ?? 'MikeFsrAdmin';

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: required('VITE_COGNITO_USER_POOL_ID'),
        userPoolClientId: required('VITE_COGNITO_USER_POOL_CLIENT_ID'),
        identityPoolId: required('VITE_COGNITO_IDENTITY_POOL_ID'),
        loginWith: { email: true },
        signUpVerificationMethod: 'code',
        userAttributes: { email: { required: true } },
        allowGuestAccess: false,
      },
    },
    API: {
      REST: {
        [apiName]: {
          endpoint: required('VITE_API_ENDPOINT'),
          region,
        },
      },
    },
  });
}
