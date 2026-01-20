# Production Checklist & Configuration Guide 🚀

## 1. Final Architecture: Host-Based Routing

| Host | Allowed Routes (Status 200) | Blocked Routes (Action) |
| :--- | :--- | :--- |
| **bookmy.bike** (Public) | `/` (Landing)<br>`/store/*` (Catalog)<br>`/compare`<br>`/profile` | `/dashboard` → **404 Not Found** (Strict)<br>`/aums/*` → **404 Not Found** |
| **aums.bookmy.bike** (Dealer) | `/` (Login)<br>`/dashboard/*` (CRM) | `/store/*` → **301 Redirect** to `bookmy.bike/store/*` (SEO Safe) |

**Rationale**:
*   **404 on Main**: Prevents dealers from accidentally logging in on the public site.
*   **301 on Subdomain**: Consolidates SEO validity to the main domain if a crawler hits the subdomain store.

## 2. Middleware Implementation (`src/middleware.ts`)

**Copy/Paste this exact code:**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') || '';
    const hostname = host.split(':')[0]; // Remove port if present

    // --- CASE A: SUBDOMAIN (aums.bookmy.bike) ---
    if (hostname === 'aums.bookmy.bike' || hostname.startsWith('aums.')) {
        // 1. BLOCK Store Routes (SEO Protection) -> 301 Redirect to Main Domain
        if (pathname.startsWith('/store') || pathname.startsWith('/compare')) {
             const mainUrl = new URL(pathname, 'https://bookmy.bike');
             request.nextUrl.searchParams.forEach((v, k) => mainUrl.searchParams.set(k, v));
             return NextResponse.redirect(mainUrl, 301);
        }

        // 2. Rewrite Root to AUMS Landing/Login
        if (pathname === '/') {
            return NextResponse.rewrite(new URL('/aums-landing', request.url));
        }
        
        return NextResponse.next();
    }

    // --- CASE B: MAIN DOMAIN (bookmy.bike) ---
    
    // 1. BLOCK Dashboard/AUMS Routes (Strict 404)
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/aums-landing')) {
        return NextResponse.rewrite(new URL('/404', request.url));
    }

    // 2. SEO Helper: Handle Legacy URL Redirects (Existing Logic)
    if (pathname.startsWith('/store/')) {
        const parts = pathname.split('/');
        if (parts.length === 6 && parts[5] && !parts[5].includes('.')) {
            const [,, make, model, variant, color] = parts;
            const url = new URL(`/store/${make}/${model}/${variant}`, request.url);
            url.searchParams.set('color', color);
            return NextResponse.redirect(url, 308);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|Logo).*)'],
};
```

**Test Commands (Smoke Test)**:
```bash
# Mobile/Laptop verification is easier, but if strictly command line:
curl -I -H "Host: aums.bookmy.bike" https://your-deployment.vercel.app/store/honda
# Expect: HTTP/2 301 location: https://bookmy.bike/store/honda

curl -I -H "Host: bookmy.bike" https://your-deployment.vercel.app/dashboard
# Expect: HTTP/2 404 (or 200 showing 404 page)
```

## 3. P0 Scope: Locked 🔒

**IN SCOPE (P0)**:
*   [x] **Public Store**: Catalog browsing, Product Details, Color Pricing, Search.
*   [x] **Lead Capture**: "Request Callback" form (Name, Phone, City) -> Saves to DB.
*   [x] **Dealer Auth**: Email/Password Login on `aums` subdomain.
*   [x] **Dealer Dashboard**: Simple table view of Leads belonging to that dealer.

**NOT IN SCOPE**:
*   [ ] Payments / Checkout.
*   [ ] Inventory Management / VIN assignment.
*   [ ] Invoicing / PDF Generation.
*   [ ] Advanced CRM (Funnel, Follow-ups).
*   [ ] **UI/Theming Overhauls** (Strictly forbidden).

## 4. Auth Plan & Dealer Onboarding

*   **Provider**: Supabase Auth (Email + Password).
*   **Session Strategy**: **Separate Sessions** (Default).
    *   *Why*: Simpler for P0. No shared cookie config issues.
    *   *Effect*: Logging into `aums` does not log you into `bookmy` (and vice versa), which is actually safer.
*   **Dealer Onboarding (P0)**: **Manual SQL**.
    *   *Process*: User signs up on `aums` -> Alert received -> Admin runs SQL to link them to a tenant.
    *   *SQL*: `update profiles set tenant_id = (select id from tenants where name = 'Noida Honda') where email = 'dealer@honda.com';`

## 5. Supabase SQL (Schema + Indexes)

**Run this in Supabase SQL Editor:**

```sql
-- 1. TENANTS (Dealers)
create table tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subdomain text unique,
  created_at timestamptz default now()
);

-- 2. PROFILES (Users linked to Tenants)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  tenant_id uuid references tenants(id),
  role text default 'dealer_staff',
  created_at timestamptz default now()
);

-- 3. LEADS (Customer Inquiries)
create table leads (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id), -- Server-side only
  customer_name text not null,
  customer_phone text not null,
  customer_city text,
  interest_model text,
  interest_variant text,
  interest_color text,
  price_snapshot jsonb, -- Frozen price at time of inquiry
  utm_data jsonb, -- Source tracking
  status text default 'NEW',
  created_at timestamptz default now()
);

-- 4. INDEXES
create index idx_leads_tenant on leads(tenant_id);
create index idx_leads_created on leads(created_at desc);
create index idx_profiles_tenant on profiles(tenant_id);

-- 5. FUNCTION to create Profile on Signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 6. RLS Policies (Security)

**Run this to Secure Data:**

```sql
-- Enable RLS
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table leads enable row level security;

-- 1. LEADS: Dealers see ONLY their own leads
create policy "Dealers see own leads" on leads
for select using (
  tenant_id in (
    select tenant_id from profiles where id = auth.uid()
  )
);

-- 2. LEADS: PUBLIC INSERT BLOCKED ⛔
-- We removed the 'check(true)' policy. 
-- Inserts will happen exclusively via Server Actions using SERVICE_ROLE_KEY.

-- 3. PROFILES: Users see own profile
create policy "Users see own profile" on profiles
for select using (id = auth.uid());
```

## 7. Data Write Strategy (Server Actions)

*   **Client Writes?**: **Strictly NO**. Database is read-only for Anon.
*   **Strategy**: Next.js Server Actions with `SUPABASE_SERVICE_ROLE_KEY`.

**Action: `submitLead(formData)`**
*   **Inputs**:
    *   `name`, `phone`, `city`
    *   `model`, `variant`, `color`
    *   `priceSnapshot` (JSON)
    *   `utm` (JSON)
*   **Server Logic**:
    1.  Validate inputs (Zod).
    2.  Determine `tenant_id` (Default to generic or derived from Host header).
    3.  Insert into `leads` using **Admin Client** (bypasses RLS).
*   **Output**: `{ success: true, id: 'uuid' }`

## 8. Env Vars

**Vercel Environment Variables** (Copy this list):

| Name | Value Source | Usage |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings -> API | Public connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings -> API | Public RLS interactions |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings -> API | **SECRET** (Server Actions) |
| `MIGRATION_PASSWORD_SECRET` | Random 32+ char secret | Required for phone OTP login/session bootstrap |
| `NEXT_PUBLIC_SITE_URL` | `https://bookmy.bike` | Canonical Generaton |

**Local `.env`**: Copy the exact same list.

## 9. Vercel Setup Guide

1.  **Account**: Log in to Vercel.
2.  **Add New**: Click "Add New..." -> "Project".
3.  **Git**: Select your `bookmy.bike` repo -> Click "Import".
4.  **Framework**: It will auto-detect Next.js (Leave default).
5.  **Env Vars**: Expand "Environment Variables". Paste the 4 keys from Section 8.
6.  **Deploy**: Click "Deploy". Wait for green checks ✅.
7.  **Domains**: Go to Project Settings -> Domains.
    *   Add `bookmy.bike` (Main)
    *   Add `aums.bookmy.bike` (Subdomain)
    *   *Note*: Vercel will give you DNS values to copy.

## 10. DNS Records (GoDaddy/Cloudflare)

**Note**: Vercel handles SSL auto-magically. You just point DNS.

| Type | Name | Value | Proxy Status (Cloudflare) |
| :--- | :--- | :--- | :--- |
| **A** | `@` (Root) | `76.76.21.21` | Proxied is OK, or DNS Only. |
| **CNAME** | `www` | `cname.vercel-dns.com` | Proxied is OK. |
| **CNAME** | `aums` | `cname.vercel-dns.com` | Proxied is OK. |

## 11. Go-Live Smoke Test

1.  [ ] **Open `https://bookmy.bike`**: Should load Landing Page.
2.  [ ] **Visit Store**: `/store/honda/activa-6g/standard`.
    *   Change Color -> Verify Price changes.
    *   Verify URL updates (`?color=...`).
3.  [ ] **Submit Lead**: Fill "Request Callback".
    *   Check Supabase `leads` table -> Row should appear.
4.  [ ] **Open `https://aums.bookmy.bike`**: Should show Login.
    *   Try `/store` -> Should redirect to main site.
5.  [ ] **Login Dealer**: Enter credentials.
    *   Should see Dashboard.
    *   Should see the Lead created in Step 3 (if linked to that tenant).

---
**Confirmation**:
I confirm **NO UI/Component changes** are included in this plan outside of the Login Form logic and Dashboard Lead Table implementation.

**Ready?** Reply **"Start P0"** to execute.
