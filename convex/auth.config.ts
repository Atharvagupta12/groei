// The Clerk issuer is the "Issuer" shown on the Clerk JWT template named "convex".
// Set CLERK_JWT_ISSUER_DOMAIN in the Convex dashboard, especially for production.
const authConfig = {
  providers: [
    {
      domain:
        process.env.CLERK_JWT_ISSUER_DOMAIN ?? "https://renewed-coyote-90.clerk.accounts.dev/",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
