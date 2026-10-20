# Google OAuth verification for Google Calendar

Callio asks for one sensitive scope, `https://www.googleapis.com/auth/calendar.events`, so agents can read
your day and add or move events when you ask. Sign-in itself only uses `openid email profile` and needs no
review. Until Google approves the calendar scope, people who connect it see an "unverified app" screen, and
at most 100 users can grant it.

Expect a few days to two weeks. Google replies by email; answer quickly.

## 1. Prove you own callio.site
Google Search Console → Add property → Domain → `callio.site` → add the TXT record it gives you at your DNS
provider → Verify. Use the same Google account that owns the Cloud project.

## 2. Enable the Calendar API
Google Cloud Console → APIs & Services → Library → **Google Calendar API** → Enable.

## 3. Branding (Google Auth Platform → Branding)
- App name: **Callio** (must match what users see on callio.site)
- User support email: your support address
- App logo: upload `public/brand/google-oauth-logo-120.png` (120×120)
- Application home page: `https://callio.site`
- Privacy policy: `https://callio.site/privacy` (it contains the Limited Use statement Google looks for)
- Terms of service: `https://callio.site/terms`
- Authorized domains: `callio.site`
- Developer contact email: yours

## 4. OAuth client (Google Auth Platform → Clients → your Web client)
Authorized redirect URIs, keep the sign-in ones and add the calendar ones:
- `https://callio.site/api/auth/callback/google` (sign-in)
- `https://api.callio.site/oauth/google/callback` (calendar, production)
- `http://localhost:3417/api/auth/callback/google` and `http://localhost:8000/oauth/google/callback` (local dev)

## 5. Data access (Google Auth Platform → Data Access → Add or remove scopes)
Add `.../auth/calendar.events`. When asked why, paste:

> Callio is a personal AI voice assistant. People talk to their assistant by voice in our web app. Connecting
> Google Calendar is optional and separate from sign-in (in the app under You → Connections). With the
> calendar.events scope, the assistant (1) reads the user's events for a day so it can answer "what's on
> today?" and deliver a morning briefing the user scheduled, and (2) creates an event or changes an event's
> time only when the user explicitly asks during a call, for example "move my 3pm to tomorrow". The assistant
> always repeats the details and asks for confirmation before changing anything, and it never deletes events.
> We need calendar.events rather than calendar.readonly because adding and moving events is a core feature
> users ask for. Calendar data is used only to provide this feature; it is not sold, not used for advertising,
> and not used to train AI models. Users can disconnect at any time, which deletes our token immediately.

## 6. Audience
User type **External**, publishing status **In production**.

## 7. Record the demo video
Google needs a real screen recording of the app, in English, showing the consent screen with the OAuth
client ID visible in the address bar. Use a test Google account with two or three events today (for
example "Call with Dana" at 3 pm). Record with QuickTime (File → New Screen Recording), browser window at
1080p, address bar visible the whole time. Two to four minutes is plenty.

| # | Show | Say or caption |
|---|---|---|
| 1 | `https://callio.site`, then scroll the privacy policy to **Google user data** | "Callio is a personal AI voice assistant. This is our privacy policy and Limited Use statement." |
| 2 | **Start free** → Continue with Google → back in the app | "Users sign in with Google using only their basic profile." |
| 3 | App → **You** → **Connections** → **Connect Google Calendar** | "Connecting Google Calendar is optional and separate from sign-in." |
| 4 | Google's consent screen. **Zoom into the address bar** so `client_id=…` is readable, then show the app name and the calendar permission | "This is our OAuth client. We request calendar.events." |
| 5 | Click **Continue/Allow** → back on You with "Google Calendar connected" | "The user grants access." |
| 6 | Open Google Calendar in another tab and show today's events | "These are the user's events." |
| 7 | Back in Callio: Home → **Call** your agent. Ask "What's on my calendar today?" Keep captions on so the answer is visible | "The assistant reads today's events to answer the user." |
| 8 | Say "Move my call with Dana to 4pm." The agent repeats it and asks to confirm. Say "Yes." The "Moving…" chip turns into a tick | "The assistant only changes events when the user asks and confirms." |
| 9 | Refresh Google Calendar: the event is now at 4 pm | "Here is the change in Google Calendar." |
| 10 | You → Connections → **Disconnect** | "Users can disconnect at any time, which deletes our access." |

Upload to YouTube as **Unlisted**, and put the link in the verification form.

## 8. Submit
Google Auth Platform → Verification Center → **Prepare for verification** → submit. Reply to Google's emails
from the same account. If they ask for changes, they're usually wording on the privacy policy or a clearer shot
in the video.
