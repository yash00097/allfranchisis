# All Franchisis

Project documentation will be added here.

## Sentry

Set `NEXT_PUBLIC_SENTRY_DSN` in `.env` with the DSN from the Sentry project before running the app. The SDK captures errors and traces in development and production, sampling 100% of development traces and 10% of production traces.

To verify the integration, run `npm run dev`, trigger a real application error, and confirm it appears in the Sentry project. A Sentry account, project, and DSN are required for event verification.
