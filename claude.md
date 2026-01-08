# Voice Bot Frontend - Next.js + shadcn/ui

## Overview
Frontend dashboard for the Voice Assistant Bot. Users can manage their profile, connect Google Calendar, set news preferences, and view their daily briefing settings.

---

## Design System

### **Monochromatic Color Palette**
This project uses a **strict monochromatic design** - Black, White, and Grays only.

**Light Mode Colors:**
- Background: White (`#FFFFFF`)
- Text: Black (`#000000`)
- Buttons: Black background, White text
- Cards/Borders: Gray (`#E5E5E5`, `#D4D4D4`)
- Muted text: Gray (`#737373`, `#525252`)
- Hover states: Darker gray

**Dark Mode Colors (Inverted):**
- Background: Black (`#000000`)
- Text: White (`#FFFFFF`)
- Buttons: White background, Black text
- Cards/Borders: Dark gray (`#262626`, `#404040`)
- Muted text: Light gray (`#A3A3A3`, `#D4D4D4`)
- Hover states: Lighter gray

**Dark Mode Behavior:**
- Dark mode **inverts** the color scheme
- Black buttons → White buttons
- White backgrounds → Black backgrounds
- Gray shades adjust accordingly
- NO colors - only black, white, and gray tones

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **Authentication**: NextAuth.js (Google OAuth)
- **Icons**: Lucide React
- **Notifications**: Sonner (toast)
- **Theme**: next-themes (dark mode support)

---

## Installed shadcn/ui Components

### Core Components (✅ Installed)
1. **Button** (`button.tsx`) - All CTAs and actions
2. **Card** (`card.tsx`) - Dashboard sections and containers
3. **Input** (`input.tsx`) - Text inputs for forms
4. **Label** (`label.tsx`) - Form field labels
5. **Badge** (`badge.tsx`) - Status indicators (Connected, Active, etc.)
6. **Avatar** (`avatar.tsx`) - User profile picture

### Form Components (✅ Installed)
7. **Form** (`form.tsx`) - Form wrapper with validation
8. **Switch** (`switch.tsx`) - Toggle switches for preferences
9. **Checkbox** (`checkbox.tsx`) - Checkboxes for terms/conditions

### Feedback Components (✅ Installed)
10. **Alert** (`alert.tsx`) - Info/warning/error messages
11. **Sonner** (`sonner.tsx`) - Toast notifications (replaces toast)
12. **Skeleton** (`skeleton.tsx`) - Loading skeletons

### Navigation & Interaction (✅ Installed)
13. **Dialog** (`dialog.tsx`) - Modal dialogs for confirmations
14. **Dropdown Menu** (`dropdown-menu.tsx`) - User menu, settings dropdown
15. **Progress** (`progress.tsx`) - Setup completion indicator

### Utilities
- **lib/utils.ts** - `cn()` helper for className merging

---

## Project Structure

```
voice-bot-fe/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles
│   │
│   ├── (auth)/                 # Auth group
│   │   ├── signin/
│   │   │   └── page.tsx        # Sign in page
│   │   └── layout.tsx          # Auth layout
│   │
│   └── (dashboard)/            # Dashboard group (protected)
│       ├── dashboard/
│       │   ├── page.tsx        # Main dashboard
│       │   ├── account/
│       │   │   └── page.tsx    # Account settings
│       │   └── topics/
│       │       └── page.tsx    # News topics management
│       └── layout.tsx          # Dashboard layout
│
├── components/
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── form.tsx
│   │   ├── switch.tsx
│   │   ├── checkbox.tsx
│   │   ├── alert.tsx
│   │   ├── sonner.tsx
│   │   ├── skeleton.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── progress.tsx
│   │
│   ├── layout/                 # Layout components
│   │   ├── header.tsx          # Site header
│   │   ├── footer.tsx          # Site footer
│   │   ├── sidebar.tsx         # Dashboard sidebar
│   │   ├── user-nav.tsx        # User navigation dropdown
│   │   └── theme-toggle.tsx    # Dark mode toggle button
│   │
│   ├── landing/                # Landing page components (✅ Complete)
│   │   ├── hero.tsx            # Hero section
│   │   ├── features.tsx        # Features section
│   │   ├── how-it-works.tsx    # How it works section
│   │   └── cta.tsx             # Call to action section
│   │
│   ├── dashboard/              # Dashboard components
│   │   ├── stats-card.tsx      # Stats/info card
│   │   ├── phone-display.tsx   # Phone number display
│   │   ├── calendar-status.tsx # Calendar connection status
│   │   ├── news-topics-form.tsx # News topics input
│   │   ├── preferences-form.tsx # Feature toggles
│   │   └── setup-progress.tsx  # Setup completion indicator
│   │
│   ├── auth/                   # Auth components (✅ Complete)
│   │   └── google-signin-button.tsx
│   │
│   └── providers/              # Context providers (✅ Complete)
│       ├── theme-provider.tsx  # Dark mode provider
│       └── session-provider.tsx # NextAuth session provider
│
├── auth.ts                     # NextAuth configuration (✅ Complete)
├── middleware.ts               # Route protection middleware (✅ Complete)
│
├── lib/
│   ├── utils.ts                # Utility functions (cn helper)
│   ├── api.ts                  # API client for backend
│   └── validations.ts          # Zod schemas for forms
│
├── hooks/                      # Custom React hooks
│   ├── use-user.ts             # User data hook
│   ├── use-preferences.ts      # User preferences hook
│   └── use-toast.ts            # Toast notification hook
│
├── types/
│   ├── user.ts                 # User types
│   ├── preferences.ts          # Preferences types
│   └── api.ts                  # API response types
│
└── public/                     # Static assets
    └── images/
```

---

## Dark Mode Implementation

### **1. Theme Provider Setup** (`components/providers/theme-provider.tsx`)

```tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### **2. Root Layout** (`app/layout.tsx`)

```tsx
import { ThemeProvider } from "@/components/providers/theme-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### **3. Theme Toggle Button** (`components/layout/theme-toggle.tsx`)

```tsx
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-9 w-9"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

### **4. Global CSS Configuration** (`app/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light mode - Monochromatic */
    --background: 0 0% 100%;        /* White */
    --foreground: 0 0% 0%;          /* Black */

    --card: 0 0% 100%;              /* White */
    --card-foreground: 0 0% 0%;     /* Black */

    --primary: 0 0% 0%;             /* Black */
    --primary-foreground: 0 0% 100%; /* White */

    --secondary: 0 0% 90%;          /* Light Gray */
    --secondary-foreground: 0 0% 0%; /* Black */

    --muted: 0 0% 90%;              /* Light Gray */
    --muted-foreground: 0 0% 45%;   /* Medium Gray */

    --accent: 0 0% 90%;             /* Light Gray */
    --accent-foreground: 0 0% 0%;   /* Black */

    --border: 0 0% 90%;             /* Light Gray */
    --input: 0 0% 90%;              /* Light Gray */
    --ring: 0 0% 0%;                /* Black */

    --radius: 0.5rem;
  }

  .dark {
    /* Dark mode - Inverted Monochromatic */
    --background: 0 0% 0%;          /* Black */
    --foreground: 0 0% 100%;        /* White */

    --card: 0 0% 5%;                /* Near Black */
    --card-foreground: 0 0% 100%;   /* White */

    --primary: 0 0% 100%;           /* White */
    --primary-foreground: 0 0% 0%;  /* Black */

    --secondary: 0 0% 15%;          /* Dark Gray */
    --secondary-foreground: 0 0% 100%; /* White */

    --muted: 0 0% 15%;              /* Dark Gray */
    --muted-foreground: 0 0% 64%;   /* Light Gray */

    --accent: 0 0% 15%;             /* Dark Gray */
    --accent-foreground: 0 0% 100%; /* White */

    --border: 0 0% 15%;             /* Dark Gray */
    --input: 0 0% 15%;              /* Dark Gray */
    --ring: 0 0% 100%;              /* White */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## Styling Guidelines

### **Monochromatic Design Rules**

**DO:**
- ✅ Use only black, white, and gray
- ✅ Use different shades of gray for hierarchy
- ✅ Use borders and spacing for separation
- ✅ Use font weight for emphasis
- ✅ Use opacity for disabled states

**DON'T:**
- ❌ NO blue, green, red, or any colors
- ❌ NO colored badges (use gray variants)
- ❌ NO colored status indicators (use text/icons)
- ❌ NO accent colors

### **Component Styling Examples**

**Buttons:**
```tsx
// Light mode: Black button with white text
// Dark mode: White button with black text
<Button className="bg-foreground text-background hover:bg-foreground/90">
  Click me
</Button>

// Secondary button (gray)
<Button variant="secondary">
  Secondary
</Button>

// Ghost button (transparent)
<Button variant="ghost">
  Cancel
</Button>
```

**Cards:**
```tsx
// Light mode: White card with gray border
// Dark mode: Near-black card with dark gray border
<Card className="border-border">
  <CardHeader>
    <CardTitle className="text-foreground">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">Content</p>
  </CardContent>
</Card>
```

**Badges:**
```tsx
// No colored badges - use variants
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="outline">Inactive</Badge>
```

**Status Indicators:**
```tsx
// Use text/icons instead of colored dots
<div className="flex items-center gap-2">
  <Check className="h-4 w-4" />
  <span className="text-sm">Connected</span>
</div>

<div className="flex items-center gap-2">
  <X className="h-4 w-4" />
  <span className="text-sm text-muted-foreground">Not Connected</span>
</div>
```

### **Tailwind CSS Conventions**
- Use `cn()` helper for conditional classes
- Prefer Tailwind utilities over custom CSS
- Use consistent spacing scale (4, 8, 16, 24, 32, etc.)

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "rounded-lg border p-4",
  isActive && "bg-secondary border-foreground",
  className
)} />
```

### **Gray Scale Reference**

**Light Mode:**
- `bg-white` - Pure white background
- `bg-gray-50` - Lightest gray
- `bg-gray-100` - Light gray (cards, hover)
- `bg-gray-200` - Medium-light gray (borders)
- `text-gray-500` - Medium gray (muted text)
- `text-gray-700` - Dark gray (secondary text)
- `bg-black` - Pure black (buttons, text)

**Dark Mode:**
- `dark:bg-black` - Pure black background
- `dark:bg-gray-950` - Darkest gray
- `dark:bg-gray-900` - Dark gray (cards, hover)
- `dark:bg-gray-800` - Medium-dark gray (borders)
- `dark:text-gray-400` - Medium gray (muted text)
- `dark:text-gray-200` - Light gray (secondary text)
- `dark:bg-white` - Pure white (buttons, text)

---

## Pages & Routes

### Public Routes
- `/` - Landing page (Hero, Features, CTA)
- `/signin` - Sign in with Google

### Protected Routes (require authentication)
- `/dashboard` - Main dashboard
- `/dashboard/account` - Profile & calendar management
- `/dashboard/topics` - News topics preferences

---

## Component Guidelines

### **1. Keep page.tsx Compact**
Pages should only handle:
- Data fetching (Server Components)
- Layout composition
- Passing props to child components

```tsx
// ✅ GOOD - page.tsx
export default async function DashboardPage() {
  const user = await getUser();

  return (
    <div className="container py-8">
      <DashboardHeader user={user} />
      <DashboardStats />
      <CalendarStatus user={user} />
      <NewsTopicsSection />
    </div>
  );
}

// ❌ BAD - page.tsx with complex logic
export default function DashboardPage() {
  const [topics, setTopics] = useState([]);
  const handleSubmit = async (e) => { /* ... */ }
  // Too much logic in page.tsx
}
```

### **2. Component Organization**

**Single Responsibility**: Each component does one thing well
```tsx
// ✅ GOOD
<CalendarStatus connected={true} lastSync="2 hours ago" />

// ❌ BAD - doing too much
<DashboardCard
  type="calendar"
  news={newsData}
  preferences={prefs}
/>
```

**Composition over Props Drilling**:
```tsx
// ✅ GOOD
<Card>
  <CardHeader>
    <CardTitle>Calendar</CardTitle>
  </CardHeader>
  <CardContent>
    <CalendarStatus connected={true} />
  </CardContent>
</Card>

// ❌ BAD
<DashboardCard
  title="Calendar"
  type="status"
  showHeader={true}
  content={<CalendarStatus />}
/>
```

### **3. File Naming**
- Components: `kebab-case.tsx` (e.g., `calendar-status.tsx`)
- Types: `kebab-case.ts` (e.g., `user-types.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-user-data.ts`)

### **4. Import Order**
```tsx
// 1. React/Next imports
import { useState } from 'react';
import Link from 'next/link';

// 2. Third-party libraries
import { z } from 'zod';
import { useForm } from 'react-hook-form';

// 3. UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Local components
import { Header } from '@/components/layout/header';

// 5. Utils/lib
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// 6. Types
import type { User } from '@/types/user';
```

---

## API Integration

### Backend Endpoints
Base URL: `http://localhost:8000/api/v1`

**Authentication**: All requests (except health) require `X-API-Key` header

### API Client (`lib/api.ts`)
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// Usage example:
const user = await api.users.get(userId);
const preferences = await api.preferences.update(userId, data);
```

### Endpoints Used
- `POST /users` - Create user
- `GET /users/{user_id}` - Get user
- `PUT /users/{user_id}` - Update user
- `PUT /users/{user_id}/calendar` - Update calendar tokens
- `DELETE /users/{user_id}/calendar` - Disconnect calendar
- `GET /preferences/{user_id}` - Get preferences
- `PUT /preferences/{user_id}` - Update preferences
- `GET /briefing/preview/{user_id}` - Preview briefing

---

## NextAuth.js Setup (✅ Complete)

### Files Created
- `auth.ts` - NextAuth v5 configuration with Google provider
- `app/api/auth/[...nextauth]/route.ts` - API route handlers
- `components/auth/google-signin-button.tsx` - Sign in button component
- `components/providers/session-provider.tsx` - Session provider wrapper
- `app/(auth)/signin/page.tsx` - Sign in page
- `app/(auth)/layout.tsx` - Auth layout
- `middleware.ts` - Route protection for /dashboard routes
- `types/next-auth.d.ts` - TypeScript type extensions
- `.env.local.example` - Environment variables template

### Google OAuth Configuration
1. Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Calendar API
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
4. Scopes requested:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `openid`
   - `email`
   - `profile`

### Session Management
- NextAuth v5 (beta) with JWT strategy
- Stores access_token, refresh_token, and expires_at in session
- On successful sign-in, automatically syncs user data to backend:
  - Creates user record if doesn't exist
  - Stores encrypted OAuth tokens in backend database
  - User can access session data via `useSession()` hook (client) or `auth()` (server)

### Protected Routes
- Middleware protects all `/dashboard/*` routes
- Unauthenticated users redirected to `/signin`
- After sign-in, users redirected to `/dashboard`

---

## Forms & Validation

### Zod Schemas (`lib/validations.ts`)
```typescript
export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  location: z.string().min(2),
});

export const preferencesSchema = z.object({
  news_topic_1: z.string().optional(),
  news_topic_2: z.string().optional(),
  include_calendar: z.boolean(),
  include_weather: z.boolean(),
  include_news: z.boolean(),
});
```

### React Hook Form + shadcn/ui Form
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';

const form = useForm({
  resolver: zodResolver(preferencesSchema),
  defaultValues: { ... }
});
```

---

## Environment Variables

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_KEY=your_backend_api_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## Key Features to Implement

### 1. **Landing Page**
- Hero with value proposition
- Features showcase (Calendar, Weather, News)
- How it works (3-step process)
- CTA to sign up
- **Dark mode toggle in header**

### 2. **Dashboard**
Components needed:
- Phone number display (read-only or editable)
- Calendar connection status
  - "Connected" text with checkmark if linked
  - "Connect Calendar" button if not
- Weather location input
- News topics (2 text inputs)
- Feature toggles (3 switches)
- Setup progress bar (optional)

### 3. **Account Settings**
- Profile info (name, email, phone, location)
- Calendar management
  - Connected account display
  - Last sync time
  - Disconnect button with confirmation dialog
- Timezone selector (optional)

### 4. **News Topics**
- Two topic inputs
- Example suggestions (AI, Tech, Startups, Crypto, etc.)
- Preview of what news would be fetched
- Save button with toast notification

---

## User Flow

1. **First Visit**: User lands on landing page → clicks "Get Started" → redirected to `/signin`
2. **Sign In**: User clicks "Sign in with Google" → Google OAuth → grants calendar access → redirected to `/dashboard`
3. **First-time Setup**: Dashboard shows incomplete setup progress → user fills in:
   - Phone number
   - Location
   - News topics (optional)
4. **Usage**: User calls Twilio number → hears daily briefing
5. **Management**: User can update preferences, disconnect calendar, change topics anytime

---

## Best Practices

### **Component Structure**
```tsx
// 1. Imports
import { ... } from '...';

// 2. Types
interface ComponentProps {
  // ...
}

// 3. Component
export function Component({ prop }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState();

  // 5. Handlers
  const handleClick = () => { ... };

  // 6. Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### **Error Handling**
- Use try/catch for API calls
- Show user-friendly error messages with Alert component
- Use toast for success/error notifications

### **Loading States**
- Use Skeleton components while data loads
- Disable buttons during submission
- Show loading spinners for async actions

### **Accessibility**
- All interactive elements must be keyboard accessible
- Use semantic HTML (`<button>`, `<input>`, etc.)
- Provide aria-labels for icon-only buttons
- Ensure color contrast meets WCAG standards (easy with monochrome)

---

## Development Workflow

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## Testing Integration with Backend

1. Ensure backend is running on `http://localhost:8000`
2. Set `NEXT_PUBLIC_API_KEY` in `.env.local`
3. Test API calls with proper error handling
4. Verify Google OAuth flow works end-to-end

---

**Last Updated**: January 8, 2026
**Version**: 1.0.0
**Status**: MVP Architecture Documentation - Monochromatic Design with Dark Mode
