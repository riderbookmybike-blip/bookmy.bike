# Subdomain Architecture

The **bookmy.bike** platform uses subdomain-based routing to separate consumer marketplace experiences from enterprise/partner tools.

## Domain Mapping

| Subdomain | Target | Purpose |
| :--- | :--- | :--- |
| `bookmy.bike` | Root / Store | Public-facing marketplace for consumers to browse and buy bikes. |
| `aums.bookmy.bike` | `/aums-landing` | Enterprise landing page for partners and dealers. |
| `aums.bookmy.bike/dashboard` | `/dashboard` | Protected admin terminal for dealer operations. |

## Implementation Details

### Middleware Routing
The routing logic is defined in `src/middleware.ts`. It performs the following:

1.  **AUMS Subdomain Handling**:
    - Rewrites the root `/` to `/aums-landing` if the host starts with `aums.`.
    - Protects `/dashboard/*` routes by checking for the `aums_session` cookie.

2.  **Legacy Redirects**:
    - Any request to the main domain with the `/aums` prefix is permanently redirected to the `aums.bookmy.bike` subdomain.

3.  **Marketplace Referral Gate**:
    - The `/store/*` path on the main domain is protected by a referral gate.
    - Users must verify their identity at `/store/redeem` to receive a `store_access` cookie before browsing.

## Local Development

To test subdomain routing locally, you must map the subdomains to `127.0.0.1` in your `/etc/hosts` file:

```bash
127.0.0.1 aums.bookmy.bike
```

Then, access the application via `http://aums.bookmy.bike:3000`.
