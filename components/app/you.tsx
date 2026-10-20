"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, CircleNotch, DownloadSimple, SignOut, Trash, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LANGUAGES } from "@/components/onboarding/onboarding-flow";
import { api, ApiError } from "@/lib/api";
import { disablePush, enablePush, pushEnabled, pushSupported } from "@/lib/push";
import type { Detail, Tone, User } from "@/lib/types";
import { Connections } from "./connections";
import { btn, Chip, Field, inputClass, PageTitle, Segmented, Sheet } from "./ui";

export function YouView({ user: initial, calendarResult }: { user: User; calendarResult?: string }) {
  const router = useRouter();
  const [user, setUser] = useState(initial);
  const [form, setForm] = useState({
    nickname: initial.nickname ?? "",
    about: initial.about ?? "",
    style: initial.style ?? "",
    city: initial.city ?? "",
    timezone: initial.timezone,
    tone: initial.tone,
    detail: initial.detail,
    languages: initial.languages,
    interests: initial.interests,
  });
  const [interest, setInterest] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [form.timezone];
    }
  }, [form.timezone]);

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

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
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
          <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  id={id}
                  value={form.city}
                  maxLength={80}
                  onChange={(e) => set({ city: e.target.value })}
                  placeholder="City"
                  className={inputClass}
                />
                <select
                  value={form.timezone}
                  onChange={(e) => set({ timezone: e.target.value })}
                  aria-label="Timezone"
                  className={inputClass}
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </Field>
          {message && (
            <p role="status" className="text-[15px] text-ink-soft">
              {message}
            </p>
          )}
          <button type="button" onClick={save} disabled={busy} className={cn(btn.primary, "w-full sm:w-auto")}>
            {busy && <CircleNotch className="animate-spin" />} Save
          </button>
        </section>

        <aside className="space-y-8">
          <Connections user={user} result={calendarResult} />
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
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}

function Notifications() {
  const [on, setOn] = useState<boolean | null>(null);
  const [supported, setSupported] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void pushEnabled().then((v) => {
      setSupported(pushSupported());
      setOn(v);
    });
  }, []);
  return (
    <section>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Notifications</h2>
      <div className="mt-3 rounded-[24px] bg-plate p-5 ring-1 ring-line">
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          <Bell weight="fill" className="text-amber" /> Let agents ring you
        </p>
        <p className="mt-1 text-[14px] text-ink-soft">
          {supported
            ? "For scheduled calls and reminders, even when Callio is closed."
            : "This browser can't show call notifications. On iPhone, add Callio to your Home Screen first."}
        </p>
        {supported && on !== null && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              if (on) {
                await disablePush();
                setOn(false);
              } else {
                setOn((await enablePush()) === "granted");
              }
              setBusy(false);
            }}
            className={cn(on ? btn.soft : btn.primary, "mt-4 h-11")}
          >
            {busy && <CircleNotch className="animate-spin" />} {on ? "Turn off" : "Turn on"}
          </button>
        )}
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
      <div className="mt-3 flex flex-col gap-2">
        <button type="button" onClick={download} className={cn(btn.soft, "justify-start")}>
          <DownloadSimple /> Download my data
        </button>
        <button type="button" onClick={() => signOut({ redirectTo: "/" })} className={cn(btn.soft, "justify-start")}>
          <SignOut /> Sign out
        </button>
        <button type="button" onClick={() => setConfirm(true)} className={cn(btn.danger, "justify-start")}>
          <Trash /> Delete account
        </button>
      </div>
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
            {busy && <CircleNotch className="animate-spin" />} Delete
          </button>
        </div>
      </Sheet>
    </section>
  );
}
