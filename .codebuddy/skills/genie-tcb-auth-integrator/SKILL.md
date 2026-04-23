---
name: genie-tcb-auth-integrator
description: Implement user authentication (Google OAuth, email OTP, email password) for web apps using TCB (Tencent CloudBase). Google login uses custom login + OAuth Relay proxy. Email login supports both OTP (verification code) and password-based registration/login. Use this skill when the application needs login, signup, session management, or protected routes.
_meta_type: sdk
---

# Genie TCB Auth Integration (OAuth Relay + Email OTP + Email Password)

Implement user authentication using TCB with OAuth Relay proxy, native email verification code, and email password registration/login. User profile (email, name, avatar) is stored in TCB Auth user attributes — no database needed.

## Scenarios

- **OAuth (Google)**: Social login via Genie OAuth Relay proxy → TCB custom login
- **Email OTP (Register)**: Email verification code signup via TCB native auth (frontend SDK)
- **Email OTP (Login)**: Email verification code login via TCB native auth (frontend SDK)
- **Email Password (Register)**: Email + password signup via TCB native auth (frontend SDK)
- **Email Password (Login)**: Email + password login via TCB native auth (frontend SDK)
- **Password Reset**: Reset password via email verification code
- **Protected Routes**: Frontend route guards with `useAuth`
- **Session Management**: Automatic token persistence via TCB JS SDK
- **User Profile**: Stored in TCB Auth user attributes, read via HTTP API on page refresh

**Not recommended for:**
- Projects that don't need user authentication

## Prerequisites

**Required: Frontend React app.**

- Frontend: React app (for AuthContext and TCB JS SDK)
- Backend: **Not required** — OAuth callback is handled by a TCB cloud function (`oauth-callback`), pre-deployed by Genie

**Important:** TCB environments are created and managed by the Genie platform. Users cannot directly access the TCB console. Required login modules (including email verification code login), cloud functions, and custom login keys are all pre-configured by Genie.

## MANDATORY: TCB Environment User Confirmation

**DO NOT run `ensure-cloudbase-env.sh` or any TCB setup without explicit user approval.**

Before ANY auth integration work, you MUST follow this exact sequence:

1. **Check** if `/workspace/.env.tcb` exists:
   ```bash
   cat /workspace/.env.tcb 2>/dev/null
   ```

2. **If `.env.tcb` exists** and contains `CLOUDBASE_ENV_ID`: TCB is ready, skip to Setup Step 1.

3. **If `.env.tcb` does NOT exist**: You MUST **STOP** and use `ask_followup_question` to ask the user:
   ```
   The project does not have a TCB (Tencent CloudBase) environment yet.
   This is required for authentication features (Google OAuth, email login).

   Would you like to enable TCB authentication for this project?
   ```
   Options:
   - **Enable TCB Auth** — Creates a TCB environment with Google OAuth and email login support
   - **Skip** — Do not enable TCB auth at this time

4. **ONLY if user explicitly selects "Enable TCB Auth"**, run:
   ```bash
   bash /workspace/.codebuddy/skills/genie-tcb-auth-integrator/scripts/ensure-cloudbase-env.sh --project-dir /workspace
   ```

5. If user selects "Skip", do NOT create the environment. Inform the user that auth features require TCB and stop the auth setup.

**NEVER assume the user wants TCB enabled. NEVER skip the confirmation step. Even if the user says "add login" or "implement authentication", you MUST still ask for TCB environment confirmation first.**

If the script fails, report the error to the user. Do not retry automatically.

Verify after success: `cat /workspace/.env.tcb` should show `CLOUDBASE_ENV_ID`, `CLOUDBASE_REGION`, `CLOUDBASE_PUBLISH_KEY`.

## Setup

```bash
bash /workspace/.codebuddy/skills/genie-tcb-auth-integrator/scripts/ensure-cloudbase-env.sh --project-dir /workspace
```

If the script fails, report the error to the user. Do not retry automatically.

Verify after success: `cat /workspace/.env.tcb` should show `CLOUDBASE_ENV_ID`, `CLOUDBASE_REGION`, `CLOUDBASE_PUBLISH_KEY`.

### 1. Install Dependencies

```bash
cd frontend && npm install @cloudbase/js-sdk@3.3.2
```

### 2. Copy SDK Files

Read the following files from this skill's `lib/` directory and copy them to the project:

| Source (this skill) | Target (project) | Used by |
|---------------------|-------------------|---------|
| `lib/cloudbase-frontend.ts` | `frontend/src/lib/cloudbase.ts` | Frontend |
| `lib/auth-context.tsx` | `frontend/src/lib/AuthContext.tsx` | Frontend |
| `lib/auth-callback.tsx` | `frontend/src/pages/AuthCallback.tsx` | Frontend |

**Note:** No backend files needed. OAuth callback is handled by the `oauth-callback` TCB cloud function, pre-deployed by Genie.

### 3. Configure Vite Environment

The frontend needs TCB credentials exposed via Vite env vars. Add to `vite.config.ts`:

```typescript
import fs from 'fs'

// Inside defineConfig:
const tcbEnvPath = '/workspace/.env.tcb'
let tcbEnv: Record<string, string> = {}
if (fs.existsSync(tcbEnvPath)) {
  fs.readFileSync(tcbEnvPath, 'utf-8').split('\n').forEach(line => {
    const idx = line.indexOf('=')
    if (idx > 0) tcbEnv[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  })
}

// Add to the returned config object:
define: {
  'import.meta.env.VITE_CLOUDBASE_ENV_ID': JSON.stringify(tcbEnv.CLOUDBASE_ENV_ID || ''),
  'import.meta.env.VITE_CLOUDBASE_REGION': JSON.stringify(tcbEnv.CLOUDBASE_REGION || 'ap-shanghai'),
  'import.meta.env.VITE_CLOUDBASE_PUBLISH_KEY': JSON.stringify(tcbEnv.CLOUDBASE_PUBLISH_KEY || ''),
}
```

### 4. Wrap App with AuthProvider and Route Guards

In `frontend/src/App.tsx`:

```typescript
import { AuthProvider, useAuth } from './lib/AuthContext'
import AuthCallback from './pages/AuthCallback'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

## Environment Variables Reference (Frontend Only)

| Variable | Location | Description |
|----------|----------|-------------|
| `CLOUDBASE_ENV_ID` | `.env.tcb` | TCB environment ID |
| `CLOUDBASE_REGION` | `.env.tcb` | TCB region (default: `ap-shanghai`) |
| `CLOUDBASE_PUBLISH_KEY` | `.env.tcb` | Publishable Key (frontend, limited permissions) |

**Note:** Server API Key and Custom Login Key are not needed in the sandbox. They are managed by the Genie platform and injected into the TCB cloud function environment.

## Architecture Overview

```
Frontend (React + TCB JS SDK)             TCB Cloud Function (oauth-callback)
├── OAuth → redirect to relay proxy       ├── Exchange code via OAuth Relay
├── Email OTP → TCB native auth           ├── createTicket(uid) with RSA key
├── callFunction('oauth-callback')        ├── POST /auth/v1/signin/custom
├── AuthContext (user state)              ├── Write user profile
├── auth.setSession() for TCB session     └── Return tokens + user info
├── auth.getUser() for user profile
└── Route guards (ProtectedRoute)
```

### Key Principles

1. **TCB JS SDK v2 ONLY**: This skill uses `@cloudbase/js-sdk` v2 API exclusively. The v1 API (`getVerification`, `signInWithEmail`, `verify`, old `signUp`) is **deprecated and no longer maintained**. Do NOT use v1 methods. All auth calls must use v2 methods: `signInWithOtp`, `signUp` (with `verifyOtp` callback), `signInWithPassword`, `resetPasswordForEmail`.
2. **OAuth**: Goes through the Genie OAuth Relay proxy. The `oauth-callback` TCB cloud function exchanges the auth code for user info, creates a TCB custom login ticket, and signs in via TCB Auth HTTP API. Frontend calls it via `callFunction('oauth-callback', { code, provider })`.
3. **Email OTP**: Uses TCB v2 `auth.signInWithOtp({ email })` — unified flow that auto-registers new users and logs in existing users. Returns `verifyOtp` callback for code verification.
4. **Email + Password**: Uses `auth.signInWithPassword({ email, password })`. Users set password via `auth.resetPasswordForEmail(email)` flow.
5. **User Profile**: Stored in TCB Auth user attributes. Written by cloud function after OAuth signin, read by frontend on page refresh. **No database or localStorage needed.**
6. **Session**: TCB JS SDK manages `access_token` and `refresh_token` in browser storage. Frontend uses `auth.getSession()` to get the current access token for API calls.
7. **iframe Support**: Detects iframe and uses popup + postMessage instead of redirect.
8. **No backend needed**: All server-side OAuth logic runs in a pre-deployed TCB cloud function. The sandbox only needs frontend code.

## OAuth Relay Flow

```
1. Frontend detects iframe vs normal mode:
   - Normal: window.location.href redirect
   - Iframe: window.open() popup with ?mode=popup

   GET {OAUTH_RELAY_URL}/authorize
     ?provider=google
     &callback_url={origin}/auth/callback[?mode=popup]

2. User authorizes on Google

3. Relay redirects back:
   {origin}/auth/callback?code=AUTH_CODE&provider=google[&mode=popup]

4. Callback page calls cloud function (automatic):
   callFunction('oauth-callback', { code, provider })
   Returns { access_token, refresh_token, user }

5. Frontend establishes session:
   - Normal: auth.setSession() + navigate('/dashboard')
   - Popup: postMessage to parent, parent calls setSession()
```

**Note:** Steps 4-5 are handled automatically by the `AuthCallback` component. Developers only need to call `signInWithGoogle()` from `useAuth()`.



## Quick Start

### Google OAuth Login

```typescript
// Frontend: trigger login
const { signInWithGoogle } = useAuth()
await signInWithGoogle()

// After login, user info is available:
const { user } = useAuth()
console.log(user?.email, user?.name, user?.avatar_url)
```

### Email OTP Register (New User)

```typescript
import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

const { sendEmailCode, signUpWithEmail } = useAuth()

// Step 1: Send verification code
const verificationInfo = await sendEmailCode('user@example.com')

// Step 2: User enters 6-digit code, then register
await signUpWithEmail('user@example.com', '123456', verificationInfo)
```

### Email OTP Login (Existing User)

```typescript
const { sendEmailCode, signInWithEmail } = useAuth()

// Step 1: Send verification code
const verificationInfo = await sendEmailCode('user@example.com')

// Step 2: User enters 6-digit code, then login
await signInWithEmail('user@example.com', '123456', verificationInfo)
```

### Email + Password Login

```typescript
const { signInWithEmailPassword } = useAuth()

// User must have set a password first (via reset password flow)
await signInWithEmailPassword('user@example.com', 'myPassword123')
```

### Reset Password (Forgot Password)

```typescript
const { resetPasswordForEmail } = useAuth()

// Step 1: Send reset code to email
const resetData = await resetPasswordForEmail('user@example.com')

// Step 2: User enters verification code + new password
const { data, error } = await resetData.updateUser({
  nonce: '123456',        // verification code from email
  password: 'newPassword' // new password
})
// User is auto-logged in after successful reset
```

### Change Password (Logged In)

```typescript
const { resetPasswordForOld } = useAuth()

await resetPasswordForOld('oldPassword123', 'newPassword456')
```

### Sign Out

```typescript
const { signOut } = useAuth()
await signOut()
```

### Access User in Dashboard

```typescript
import { useAuth } from '../lib/AuthContext'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  return (
    <div>
      <img src={user?.avatar_url} alt={user?.name} />
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## Auth Methods Reference

| Method | Frontend Code | Backend Needed? |
|--------|---------------|----------------|
| Google OAuth | `signInWithGoogle()` | No (cloud function) |
| Email Send Code | `sendEmailCode(email)` | No |
| Email OTP Register | `signUpWithEmail(email, code, info)` | No |
| Email OTP Login | `signInWithEmail(email, code, info)` | No |
| Email + Password Login | `signInWithEmailPassword(email, password)` | No |
| Reset Password (forgot) | `resetPasswordForEmail(email)` | No |
| Change Password (logged in) | `resetPasswordForOld(oldPwd, newPwd)` | No |
| Sign Out | `signOut()` | No |
| Get User | `useAuth().user` | No |

## Troubleshooting

### OAuth Callback Fails

**Possible causes:**
- OAuth code already used (codes are single-use)
- OAuth Relay service is down
- Cloud function environment variables not configured

**Solution:** Check TCB console cloud function logs for `oauth-callback`.

### OAuth Callback Returns Error

**Possible causes:**
- Cloud function `CUSTOM_LOGIN_KEY_ID` or `CUSTOM_LOGIN_PRIVATE_KEY` env vars not set
- TCB Auth API unreachable
- `createTicket()` failed

**Solution:** Check TCB console cloud function configuration for environment variables.

### User Profile Empty After Login

**Possible causes:**
- Cloud function failed to write user profile (non-fatal, check cloud function logs)
- User session expired

**Solution:** Check TCB console cloud function logs. Try logging in again.

### Page Refresh Shows Login Page

**Possible causes:**
- TCB session expired (access_token no longer valid)
- `auth.getSession()` returning accessKey scope instead of user scope

**Solution:** User needs to log in again. The frontend checks `scope !== 'accessKey'` to distinguish user tokens from accessKey tokens.

## Security Best Practices

1. **Custom Login Key stays in cloud function** — injected as environment variables by Genie, never exposed to frontend or sandbox
2. **OAuth codes are single-use** — the relay exchange endpoint only accepts each code once
3. **Session tokens auto-refresh** — TCB JS SDK handles token refresh via `refresh_token`
4. **Sign out clears session** — `auth.signOut()` removes tokens from browser storage

## Resources

- **SDK Files**: `lib/cloudbase-frontend.ts`, `lib/auth-context.tsx`, `lib/auth-callback.tsx`
- **Cloud Function**: `oauth-callback` (pre-deployed by Genie, handles OAuth code exchange + custom login)
- **Environment Script**: `scripts/ensure-cloudbase-env.sh`
