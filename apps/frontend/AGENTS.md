# Frontend AGENTS Guide

This document provides comprehensive guidelines for working on the Ciel frontend application.

## Architecture Overview

The frontend is built with:
- **Next.js 15** with App Router (React Server Components)
- **TypeScript** in strict mode
- **State Management**:
  - **Jotai**: Client-side global state (auth, theme)
  - **React Query**: Server state management (API data, caching)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **i18n**: next-intl (Japanese and English)

## Directory Structure

```
apps/frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Homepage (timeline)
│   ├── globals.css          # Global styles & theme variables
│   ├── login/
│   └── signup/
├── atoms/                    # Jotai state atoms
│   ├── auth.ts              # Authentication state (localStorage)
│   └── theme.ts             # Theme preference
├── components/               # React components
│   ├── Header.tsx
│   ├── LanguageSwitcher.tsx
│   └── ui/                  # shadcn/ui components
│       ├── button.tsx
│       ├── form.tsx
│       ├── input.tsx
│       └── ...
├── lib/                      # Shared utilities
│   ├── api/                 # API client
│   │   ├── api.d.ts         # Generated OpenAPI types
│   │   ├── client.ts        # Type-safe API client
│   │   ├── scram.ts         # SCRAM authentication
│   │   └── use-api.ts       # API client hook
│   ├── hooks/               # Custom React hooks
│   │   ├── use-auth.ts      # Authentication logic
│   │   └── use-queries.ts   # React Query hooks
│   ├── errors.ts            # Error code mappings
│   └── utils.ts             # Utility functions (cn helper)
├── messages/                 # i18n translation files
│   ├── en.json
│   └── ja.json
├── providers/                # React context providers
│   ├── providers.tsx        # Main providers wrapper
│   ├── theme-provider.tsx   # Theme context (next-themes)
│   └── realtime-provider.tsx # WebSocket realtime updates
├── components.json           # shadcn/ui configuration
├── tailwind.config.ts       # Tailwind configuration
└── package.json             # Dependencies and scripts
```

## State Management Patterns

### Jotai (Client State)

Used for client-side global state with localStorage persistence:

**Authentication State** (`atoms/auth.ts`):
```tsx
// Primary atom with localStorage persistence
const authAtom = atomWithStorage<AuthState>('auth', defaultAuthState)

// Derived atoms
const tokenAtom = atom((get) => get(authAtom).token)
const userAtom = atom((get) => get(authAtom).user)
const isAuthenticatedAtom = atom((get) => !!get(authAtom).token)
```

**Features**:
- SSR-safe with custom storage adapter
- Automatic localStorage sync
- Derived atoms for computed values

### React Query (Server State)

Used for API data fetching, caching, and synchronization:

**Query Hooks** (`lib/hooks/use-queries.ts`):
```tsx
export function useTimeline() {
  const api = useApiClient()
  return useInfiniteQuery({
    queryKey: ['timeline'],
    queryFn: ({ pageParam }) => api.listTimelinePosts({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.cursor,
    staleTime: 60_000, // 1 minute
  })
}

export function usePost(postId: string) {
  const api = useApiClient()
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.getPost({ postId }),
  })
}
```

**Mutation Hooks**:
```tsx
export function useCreatePost() {
  const api = useApiClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreatePostRequest) => api.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
    },
  })
}
```

**Configuration**:
- Stale time: 1 minute
- Refetch on window focus: Disabled
- Automatic query invalidation after mutations

### WebSocket (Realtime Updates)

**RealtimeProvider** (`providers/realtime-provider.tsx`):
- Connects to backend WebSocket endpoint
- Handles reconnection with exponential backoff
- Updates React Query cache on events:
  - `post_created` → invalidates timeline
  - `post_deleted` → invalidates timeline and post
  - `reaction_updated` → updates reaction counts

## Design System & Color Rules

### Component Library

**shadcn/ui** - Built on Radix UI primitives with Tailwind CSS:
- Accessible, headless components
- Variant-based styling (class-variance-authority)
- Fully customizable via CSS variables

### Design Philosophy

**Flat Design**:
- No shadows or heavy borders
- Use color contrast for depth and hierarchy
- Clean, minimal aesthetic

### Color System

**Definition Location**: `apps/frontend/app/globals.css`

**Color Space**: **oklch** (perceptually uniform)

**Palette**: Monochrome neutral (grayscale)

**Semantic Colors**:
```css
/* Light mode */
--background: oklch(0.95 0 0)      /* Near white */
--foreground: oklch(0.145 0 0)     /* Near black */
--primary: oklch(0.205 0 0)        /* Dark gray */
--muted: oklch(0.97 0 0)           /* Light gray */
--destructive: oklch(0.577 0.245 27.325) /* Red */

/* Dark mode */
.dark {
  --background: oklch(0.145 0 0)   /* Near black */
  --foreground: oklch(0.985 0 0)   /* Near white */
  --primary: oklch(0.922 0 0)      /* Light gray */
  --muted: oklch(0.269 0 0)        /* Dark gray */
}
```

**Additional Colors**:
- `card`, `popover` - Surface colors
- `secondary`, `accent` - Alternative actions
- `border`, `input`, `ring` - UI elements
- `chart-1` to `chart-5` - Data visualization

**Border Radius System**:
```css
--radius: 0.625rem       /* 10px */
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 10px
--radius-xl: 14px
```

### Typography

- **Primary Font**: IBM Plex Sans JP (weights: 400, 500, 700)
- **Fallback**: System fonts
- **Display**: swap (for performance)

### Design Rules

⚠️ **Important**:
- Always use shadcn/ui patterns for new components
- Use CSS variables from `globals.css` for colors
- **Never hardcode color values** (e.g., `bg-[#xxx]` is forbidden)
- Maintain flat design - avoid adding shadows or heavy borders
- Use Tailwind utility classes, not inline styles

**Utility Helper** (`lib/utils.ts`):
```tsx
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Routing Structure

Next.js **App Router** with file-based routing:

```
/                 → Homepage with timeline (app/page.tsx)
/login            → Login page (app/login/page.tsx)
/signup           → Signup page (app/signup/page.tsx)
```

**Root Layout** (`app/layout.tsx`):
- Server Component for i18n
- Provider hierarchy:
  ```
  JotaiProvider
    └─ QueryClientProvider
        └─ ThemeProvider
            └─ RealtimeProvider
                └─ NextIntlClientProvider
  ```

## API Integration

### Generated Types

**Location**: `lib/api/api.d.ts` (~2000 lines)

- Auto-generated from OpenAPI spec
- Full TypeScript types for all operations
- Regenerate: `pnpm run gen:openapi`

### API Client

**Type-safe wrapper** (`lib/api/client.ts`):
```tsx
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    throw new ApiError(response.status, await response.json())
  }
  
  return response.json()
}
```

### Authentication Flow

**SCRAM-SHA-256** (`lib/api/scram.ts` + `lib/hooks/use-auth.ts`):
1. Start authentication challenge
2. Compute client proof
3. Finish authentication and receive JWT
4. Store token in localStorage via Jotai

## Internationalization (i18n)

**Implementation**: `next-intl`

**Supported Locales**:
- Japanese (ja) - Default
- English (en)

**Detection Strategy**:
1. Check `NEXT_LOCALE` cookie
2. Parse `Accept-Language` header
3. Fallback to default (ja)

**Usage**:
```tsx
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const t = useTranslations()
  return <h1>{t('login.title')}</h1>
}
```

**Translation Files**: `messages/en.json`, `messages/ja.json`

## Import Path Rules

### Use "@" Alias for Imports

Always use the `@/` alias for imports instead of relative paths:

✅ **Good**:
```tsx
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'
import { cn } from '@/lib/utils'
```

❌ **Bad**:
```tsx
import { Button } from '../components/ui/button'
import { useAuth } from '../../lib/hooks/use-auth'
```

**Exception**: Imports from the same directory MAY use relative paths, but `@/` alias is preferred for consistency:
```tsx
// In components/Header.tsx
import { LanguageSwitcher } from './LanguageSwitcher'  // Acceptable
import { LanguageSwitcher } from '@/components/LanguageSwitcher'  // Preferred
```

**Why use `@/` aliases**:
- **Readability**: Absolute paths are easier to understand at a glance
- **Maintainability**: Files can be moved without breaking import paths
- **Consistency**: One standard across the entire codebase
- **IDE Support**: Better autocomplete and navigation

**Special cases**:
- CSS imports in the same directory (e.g., `import './globals.css'`) can remain relative
- Auto-generated files should not be manually modified

## Build & Development Commands

```bash
# Development server (port 3000)
pnpm -C apps/frontend dev

# Production build
pnpm -C apps/frontend build

# Linting
pnpm -C apps/frontend lint

# Regenerate API types from OpenAPI spec
pnpm -C apps/frontend gen:openapi
```

## Adding New Features

### New Page

```tsx
// app/profile/page.tsx
'use client'
import { useTranslations } from 'next-intl'

export default function ProfilePage() {
  const t = useTranslations()
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
    </div>
  )
}
```

### New API Hook

```tsx
// lib/hooks/use-queries.ts
export function useUserProfile(userId: string) {
  const api = useApiClient()
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser({ userId }),
    enabled: !!userId,
  })
}
```

### New Component

```tsx
// components/ProfileCard.tsx
import { Button } from '@/components/ui/button'

interface ProfileCardProps {
  user: User
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold">{user.displayName}</h2>
      <p className="text-muted-foreground">{user.bio}</p>
      <Button variant="outline" className="mt-4">
        Follow
      </Button>
    </div>
  )
}
```

### New shadcn/ui Component

```bash
# Add a new shadcn/ui component
npx shadcn@latest add dialog
```

## Security

### Authentication & Authorization
- Use HTTPS in production for token transmission
- Tokens stored in localStorage (accessible only to same origin)
- Check authentication state before accessing protected features
- Never rely solely on client-side authorization checks

### XSS Prevention
- React's automatic escaping handles most cases
- **Never use** `dangerouslySetInnerHTML` unless absolutely necessary
- Sanitize user input before rendering
- Validate external URLs before using in `href` (avoid `javascript:` protocol)

### Data Exposure
- No sensitive data in URL parameters or query strings
- Never store passwords in localStorage
- Remove `console.log` statements with sensitive data before production
- Use environment variables for API endpoints

### Input Validation
- Validate file uploads (extension, size, MIME type)
- Client-side validation is UX enhancement only
- Always rely on server-side validation for security

### API Security
- Handle error responses gracefully without exposing internal details
- Implement retry logic with exponential backoff (avoid infinite loops)
- Set reasonable timeouts for API calls

## Post-Implementation Security Checklist

After writing new code, verify the following:

### Authentication & Authorization
- [ ] Protected operations check authentication state
- [ ] Users cannot access other users' data (verify userId, etc.)
- [ ] Not relying solely on client-side permission checks

### XSS Prevention
- [ ] No use of `dangerouslySetInnerHTML`
- [ ] User input properly escaped (relying on React's auto-escaping)
- [ ] External URLs validated before use in `href` (no `javascript:` protocol)

### Data Exposure
- [ ] No sensitive data in URL parameters or query strings
- [ ] No sensitive data (passwords, tokens) stored in localStorage
- [ ] No `console.log` with sensitive information

### Input Validation
- [ ] File uploads validate extension and size
- [ ] Forms include client-side validation for UX
- [ ] Trusting server-side validation, client validation is supplementary

### API Integration
- [ ] Error responses don't contain sensitive information
- [ ] Retry logic won't cause infinite loops
- [ ] API calls have reasonable timeouts

### Component Security
- [ ] No inline event handlers with user input (e.g., `onClick={eval(userInput)}`)
- [ ] External scripts loaded from trusted sources only
- [ ] Proper sanitization of rich text or markdown if rendered

---

**For backend guidelines, see**: `apps/backend/AGENTS.md`
