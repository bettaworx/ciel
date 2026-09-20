# Frontend AGENTS Guide

This document provides comprehensive guidelines for working on the Ciel frontend application.

## Architecture Overview

The frontend is built with:
- **Vite** + **TanStack Router** — a client-rendered SPA, no server rendering
- **TypeScript** in strict mode
- **State Management**:
  - **Jotai**: Client-side global state (auth, theme)
  - **React Query**: Server state management (API data, caching)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **i18n**: i18next + react-i18next (Japanese and English)

## Directory Structure

```
apps/frontend/
├── index.html                # SPA shell
├── main.tsx                  # Entry point: runtime config, then the router
├── vite.config.ts            # Build, dev server, "@" alias
├── routes/                   # TanStack Router, one file per URL
│   ├── __root.tsx           # Root layout with providers
│   ├── index.tsx            # Homepage (timeline)
│   ├── settings.route.tsx   # /settings layout
│   ├── settings.general.tsx # /settings/general
│   └── users.$username.index.tsx
├── styles/
│   ├── globals.css          # Global styles & theme variables
│   └── fonts.css            # Self-hosted web fonts
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
│   ├── theme-provider.tsx   # Theme resolution (jotai + prefers-color-scheme)
│   └── realtime-provider.tsx # WebSocket realtime updates
├── .storybook/               # Storybook configuration
│   ├── main.ts              # Framework, addons, stories glob
│   └── preview.ts           # Global decorators, dark mode toggle
├── components.json           # shadcn/ui configuration
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

- **Primary Sans Stack**: Locale-aware stack selected in `app/globals.css`
- **Font Loading**: `next/font/google` variables are defined in `app/layout.tsx`
- **Fallbacks**: Shared sans/serif fallback tokens live in `app/globals.css`
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

**TanStack Router** with flat file-based routing in `routes/`. Dots are path
separators, `$` marks a parameter, `.route.tsx` is a layout, `.index.tsx` is the
route at a path that also has children:

```
/                        → routes/index.tsx
/login                   → routes/login.tsx
/settings                → routes/settings.route.tsx + routes/settings.index.tsx
/settings/general        → routes/settings.general.tsx
/users/:username         → routes/users.$username.index.tsx
/users/:username/:tab    → routes/users.$username.$tab.tsx
```

`routeTree.gen.ts` is generated by the Vite plugin; never edit it.

A route file should stay thin — wire the URL to a component, read params with
`Route.useParams()` and search with `Route.useSearch()` (validated by a zod
schema), and leave the rest to a component under `components/`.

**Root Layout** (`routes/__root.tsx`) — provider hierarchy:
```
JotaiProvider
  └─ QueryClientProvider
      └─ I18nextProvider
          └─ ThemeProvider
              └─ RealtimeProvider
```

**Navigating**: prefer `<Link to="/...">` from `@tanstack/react-router`, which
type-checks the path. `lib/navigation.ts` and `components/ui/link.tsx` are
compatibility shims kept from the Next.js migration — they take plain string
hrefs and so lose that checking. New code does not need them.

## API Integration

### Generated Types

**Location**: `lib/api/api.d.ts` (~2000 lines)

- Auto-generated from the multi-file OpenAPI spec (`packages/api/openapi.yml` + `paths/` + `schemas/`)
- Full TypeScript types for all operations
- Regenerate: `pnpm run gen:openapi:ts` (frontend only) or `pnpm run gen:openapi` (backend Go + bundle step)

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

**Implementation**: `i18next` + `react-i18next`, configured in `i18n/index.ts`

**Supported Locales**:
- Japanese (ja) - Default
- English (en)

**Detection Strategy** (`i18n/client-locale.ts`, all in the browser):
1. `ciel:locale` in localStorage
2. `NEXT_LOCALE` cookie (kept under that name so existing preferences survive)
3. `navigator.languages`
4. Fallback to default (ja)

**Usage** — `lib/i18n.ts` keeps next-intl's shape, so keys are dotted paths and
a prefix scopes them:
```tsx
import { useTranslations } from '@/lib/i18n'

export function LoginPage() {
  const t = useTranslations()
  return <h1>{t('login.title')}</h1>
}
```

Messages use single-brace placeholders (`{count}`) and no ICU plural syntax;
`i18n/index.test.ts` pins that configuration.

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

# Linting / Formatting
pnpm run lint       # Biome: lint + 書式チェック（リポジトリ全体）
pnpm run lint:fix   # 自動修正つき

# Biome はモノレポ全体を 1 設定で見る。設定はリポジトリルートの biome.jsonc。
# ESLint / Prettier は使っていない。フロントだけ見たいときは:
#   pnpm exec biome check apps/frontend
# 初回のみ、一括フォーマットのコミットを blame から外しておくと読みやすい:
#   git config blame.ignoreRevsFile .git-blame-ignore-revs

# Regenerate API types from OpenAPI spec
pnpm -C apps/frontend gen:openapi

# Storybook
pnpm -C apps/frontend storybook        # Dev server (port 6006)
pnpm -C apps/frontend build-storybook  # Static build
```

## Adding New Features

### New Page

```tsx
// app/profile/page.tsx
'use client'
import { useTranslations } from '@/lib/i18n'

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

## Storybook

### Overview

Storybook v10.2.17 is configured for documenting and testing shadcn/ui components. Stories are co-located with their component files.

### Conventions

- **Story file location**: Co-located with components (e.g., `components/ui/button.stories.tsx` next to `button.tsx`)
- **Title format**: `"UI/ComponentName"` (e.g., `"UI/Button"`)
- **Tags**: Always include `["autodocs"]` for automatic documentation
- **Interaction tests**: Use `storybook/test` play functions for key interactions
- **Dark mode**: Available via toolbar toggle (uses `withThemeByClassName` with `.dark` class)

### Writing a New Story

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { MyComponent } from "./my-component";

const meta = {
  title: "UI/MyComponent",
  component: MyComponent,
  tags: ["autodocs"],
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { /* ... */ },
};
```

### Adding Interaction Tests

```tsx
import { expect, userEvent, within } from "storybook/test";

export const ClickTest: Story = {
  args: { children: "Click me" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));
    await expect(/* assertion */).toBeTruthy();
  },
};
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

