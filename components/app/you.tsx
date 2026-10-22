"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  AddressBook,
  CaretRight,
  Compass,
  DownloadSimple,
  Monitor,
  PlugsConnected,
  SignOut,
  Trash,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LANGUAGES } from "@/lib/languages";
import { api, ApiError } from "@/lib/api";
import { pronounsOf } from "@/lib/pronouns";
import type { Detail, Pronouns, Tone, User } from "@/lib/types";
import { CookieSettingsButton } from "@/components/analytics/analytics";
import { CityInput } from "./city-input";
import { NotificationSetup } from "./notification-setup";
import { TimezoneSelect } from "./select-menu";
import { btn, Chip, Field, inputClass, PageTitle, Segmented, Sheet } from "./ui";
import { Spinner } from "@/components/brand/logo-loader";

export function YouView({ user: initial }: { user: User }) {
  const router = useRouter();
  const [user, setUser] = useState(initial);
  const [form, setForm] = useState(() => ({
    nickname: initial.nickname ?? "",
    pronouns: pronounsOf(initial),
    about: initial.about ?? "",
    style: initial.style ?? "",
    city: initial.city ?? "",
    timezone: initial.timezone,
    tone: initial.tone,
    detail: initial.detail,
    languages: initial.languages,
    interests: initial.interests,
  }));
  // What's on the account. Pronouns worked out from About (never chosen) count as unsaved, so saving locks them in.
  const [saved, setSaved] = useState(() => JSON.stringify({ ...form, pronouns: initial.pronouns ?? null }));
  const dirty = JSON.stringify(form) !== saved;
  const [interest, setInterest] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const next = await api<User>("/me", {
        method: "PATCH",
        body: {
          ...form,
          nickname: form.nickname.trim() || null,
          about: form.about.trim() || null,
          style: form.style.trim() || null,
          city: form.city.trim() || null,
        },
      });
      setUser(next);
      setSaved(JSON.stringify(form));
      setMessage("Saved. Your agents will use this from your next call.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const addInterest = () => {
    const v = interest.trim();
    if (v && !form.interests.includes(v) && form.interests.length < 12)
      set({ interests: [...form.interests, v.slice(0, 40)] });
    setInterest("");
  };

  return (
    <>
      <PageTitle title="You" subtitle={`Signed in as ${user.email}`} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          <h2 className="font-display text-[22px] font-medium tracking-[-0.03em]">How your agents know you</h2>
          <Field label="What they call you">
            {(id) => (
              <input
                id={id}
                value={form.nickname}
                maxLength={40}
                onChange={(e) => set({ nickname: e.target.value })}
                className={inputClass}
              />
            )}
          </Field>
          <div>
            <p className="text-[14px] font-semibold">How they refer to you</p>
            <p className="mb-2 mt-0.5 text-[13px] text-ink-soft">
              When your agent talks about you, like on a call to your mum.
            </p>
            <Segmented<Pronouns>
              label="How they refer to you"
              value={form.pronouns}
              onChange={(pronouns) => set({ pronouns })}
              options={[
                { value: "he", label: "He" },
                { value: "she", label: "She" },
                { value: "they", label: "They" },
              ]}
            />
          </div>
          <Field
            label="About you"
            hint="A few lines in your own words: what you do, who matters, what you're working on."
          >
            {(id) => (
              <textarea
                id={id}
                rows={4}
                maxLength={2000}
                value={form.about}
                onChange={(e) => set({ about: e.target.value })}
                className={cn(inputClass, "resize-y")}
              />
            )}
          </Field>
          <Field
            label="How you talk"
            hint="So they can match you. For example: “Short and direct, dry humour, no corporate speak.”"
          >
            {(id) => (
              <textarea
                id={id}
                rows={3}
                maxLength={1500}
                value={form.style}
                onChange={(e) => set({ style: e.target.value })}
                className={cn(inputClass, "resize-y")}
              />
            )}
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[14px] font-semibold">Tone</p>
              <Segmented<Tone>
                label="Tone"
                value={form.tone}
                onChange={(tone) => set({ tone })}
                options={[
                  { value: "casual", label: "Casual" },
                  { value: "balanced", label: "Balanced" },
                  { value: "formal", label: "Formal" },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-[14px] font-semibold">Detail</p>
              <Segmented<Detail>
                label="Detail"
                value={form.detail}
                onChange={(detail) => set({ detail })}
                options={[
                  { value: "brief", label: "Brief" },
                  { value: "normal", label: "Normal" },
                  { value: "detailed", label: "Detailed" },
                ]}
              />
            </div>
          </div>
          <div>
            <p className="text-[14px] font-semibold">Interests</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">Used for briefings and small talk.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {form.interests.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => set({ interests: form.interests.filter((x) => x !== i) })}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[14px] font-medium text-page"
                  aria-label={`Remove ${i}`}
                >
                  {i} <X />
                </button>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addInterest();
                }}
              >
                <input
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  onBlur={addInterest}
                  placeholder="Add one…"
                  className="h-10 w-36 rounded-full bg-ink/[0.06] px-4 text-[14px] outline-none focus:ring-2 focus:ring-ink"
                />
              </form>
            </div>
          </div>
          <div>
            <p className="text-[14px] font-semibold">Languages</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <Chip
                  key={l.code}
                  selected={form.languages.includes(l.code)}
                  onClick={() =>
                    set({
                      languages: form.languages.includes(l.code)
                        ? form.languages.length > 1
                          ? form.languages.filter((c) => c !== l.code)
                          : form.languages
                        : [...form.languages, l.code].slice(0, 5),
                    })
                  }
                >
                  {l.label}
                </Chip>
              ))}
            </div>
          </div>
          <Field label="Where you are">
            {(id) => (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <CityInput
                  id={id}
                  value={form.city}
                  onChange={(city) => set({ city })}
                  onPick={(place) => set({ city: place.name, timezone: place.timezone })}
                />
                <TimezoneSelect value={form.timezone} onChange={(timezone) => set({ timezone })} />
              </div>
            )}
          </Field>
          {/* Only there when something changed: sits above the tab bar on phones. */}
          <AnimatePresence>
            {dirty ? (
              <motion.div
                key="bar"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                className="sticky bottom-[calc(env(safe-area-inset-bottom)+88px)] z-20 flex items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-page shadow-[0_20px_50px_-20px_rgb(0_0_0/0.6)] lg:bottom-6"
              >
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                  {message && !busy ? message : "Unsaved changes"}
                </span>
                <button
                  type="button"
                  onClick={save}
                  disabled={busy}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-page px-5 text-[15px] font-semibold text-ink"
                >
                  {busy && <Spinner />} Save
                </button>
              </motion.div>
            ) : (
              message && (
                <p key="status" role="status" className="text-[15px] text-ink-soft">
                  {message}
                </p>
              )
            )}
          </AnimatePresence>
        </section>

        <aside className="space-y-8">
          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">
              <span className="lg:hidden">More</span>
              <span className="hidden lg:inline">Help</span>
            </h2>
            <div className="mt-3 divide-y divide-line overflow-hidden rounded-[24px] bg-plate ring-1 ring-line">
              {[
                {
                  href: "/app/contacts",
                  icon: AddressBook,
                  tint: "bg-coral/30",
                  phoneOnly: true,
                  title: "Contacts and your phone",
                  sub: "People your agent can call, and missed-call backup",
                },
                {
                  href: "/app/connections",
                  icon: PlugsConnected,
                  tint: "bg-peri/30",
                  phoneOnly: true,
                  title: "Connections",
                  sub: user.integrations?.google_calendar?.connected
                    ? "Morning call, calendar, sites"
                    : "Morning call, Google Calendar, sites",
                },
                {
                  href: "/app/tasks",
                  icon: Monitor,
                  tint: "bg-teal/30",
                  phoneOnly: true,
                  title: "Tasks",
                  sub: "Things your agents did on the web",
                },
                {
                  href: "/app?tour=1",
                  icon: Compass,
                  tint: "bg-amber/40",
                  title: "Take the tour again",
                  sub: "A 30-second look around",
                },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-3 px-5 py-4 transition-colors hover:bg-ink/[0.03]",
                    "phoneOnly" in l && l.phoneOnly && "lg:hidden",
                  )}
                >
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl text-[20px]", l.tint)}>
                    <l.icon weight="fill" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{l.title}</span>
                    <span className="block truncate text-[13px] text-ink-soft">{l.sub}</span>
                  </span>
                  <CaretRight className="text-ink-soft" />
                </Link>
              ))}
            </div>
          </section>
          <Notifications />
          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Appearance</h2>
            <div className="mt-3 flex items-center justify-between rounded-[24px] bg-plate px-5 py-3 ring-1 ring-line">
              <span className="text-[15px]">Light or dark</span>
              <ThemeToggle />
            </div>
          </section>
          <Account />
          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Legal</h2>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
              {[
                ["/privacy", "Privacy"],
                ["/terms", "Terms"],
                ["/refunds", "Refunds"],
                ["/acceptable-use", "Acceptable use"],
                ["/imprint", "Imprint"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton className="text-ink-soft underline-offset-4 hover:text-ink hover:underline" />
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}

function Notifications() {
  return (
    <section>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Notifications</h2>
      <div className="mt-3">
        <NotificationSetup />
      </div>
    </section>
  );
}

function Account() {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    const data = await api<unknown>("/me/export");
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "callio-my-data.json" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Account</h2>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[24px] bg-plate ring-1 ring-line">
        {[
          { label: "Download my data", icon: DownloadSimple, onClick: download, danger: false },
          { label: "Sign out", icon: SignOut, onClick: () => signOut({ redirectTo: "/" }), danger: false },
          { label: "Delete account", icon: Trash, onClick: () => setConfirm(true), danger: true },
        ].map((item) => (
          <li key={item.label}>
            <button
              type="button"
              onClick={item.onClick}
              className={cn(
                "flex min-h-13 w-full items-center gap-3 px-5 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-ink/[0.03]",
                item.danger && "text-[#B0412C] dark:text-coral",
              )}
            >
              <item.icon className="text-[18px]" /> {item.label}
            </button>
          </li>
        ))}
      </ul>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Delete your account?">
        <p className="text-[15px] text-ink-soft">
          This deletes your agents, memory, call history and schedules. Unused credits are lost. If you have a paid
          plan, cancel it first. This can&apos;t be undone.
        </p>
        {error && <p className="mt-4 text-[14px]">{error}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setConfirm(false)} className={btn.soft}>
            Keep it
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api("/me", { method: "DELETE" });
                await signOut({ redirectTo: "/" });
              } catch (err) {
                setError(err instanceof ApiError ? err.message : "Couldn't delete. Try again.");
                setBusy(false);
              }
            }}
            className={btn.danger}
          >
            {busy && <Spinner />} Delete
          </button>
        </div>
      </Sheet>
    </section>
  );
}
