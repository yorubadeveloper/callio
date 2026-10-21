"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChatCircleText, DeviceMobile, PhoneCall, Plus, Trash, UserPlus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { LANGUAGES, languageName } from "@/lib/languages";
import type { PersonalAgent } from "@/lib/agents/personalize";
import type { Contact, PhoneSettings, User } from "@/lib/types";
import { Spinner } from "@/components/brand/logo-loader";
import { SelectMenu } from "./select-menu";
import { btn, Field, inputClass, PageTitle, Segmented, Sheet, Switch } from "./ui";

// Real phone calls: your own number (so a missed app call can ring your phone) and the people your agent can
// call with a message. Numbers are only ever added here, never by voice on a call.

const TINTS = ["bg-coral/30", "bg-amber/40", "bg-teal/30", "bg-peri/35"];
const tintFor = (name: string) => TINTS[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % TINTS.length];

// Two-digit country codes; 1 (North America) and 7 are one digit, everything else is three (ITU E.164 zones).
const TWO_DIGIT = new Set(
  "20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 51 52 53 54 55 56 57 58 60 61 62 63 64 65 66 81 82 84 86 90 91 92 93 94 95 98".split(
    " ",
  ),
);

/** "+2348031234567" → "+234 803 123 4567": easier to check at a glance. */
function spaced(phone: string) {
  const digits = phone.replace(/^\+/, "");
  const cc = /^[17]/.test(digits) ? 1 : TWO_DIGIT.has(digits.slice(0, 2)) ? 2 : 3;
  const rest = digits.slice(cc);
  const grouped =
    cc === 1 && digits[0] === "1" && rest.length === 10
      ? `${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`
      : rest.replace(/(\d{3})(?=\d{4,})/g, "$1 ");
  return `+${digits.slice(0, cc)} ${grouped}`;
}

function errorText(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

export function ContactsView({
  user,
  phone,
  contacts,
  agents,
}: {
  user: User;
  phone: PhoneSettings;
  contacts: Contact[];
  agents: PersonalAgent[];
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [messaging, setMessaging] = useState<Contact | null>(null);
  const locked = !phone.plan_allows;

  return (
    <>
      <PageTitle
        title="Contacts"
        subtitle="Your agent can phone the people here with a message from you, then tell you what they said."
        action={
          contacts.length > 0 ? (
            <button type="button" onClick={() => setAdding(true)} className={cn(btn.primary, "shrink-0 px-5")}>
              <Plus weight="bold" /> <span className="hidden sm:inline">Add someone</span>
              <span className="sm:hidden">Add</span>
            </button>
          ) : undefined
        }
      />

      {!phone.available && (
        <p className="mb-6 rounded-2xl bg-amber/25 px-4 py-3 text-[14px]">
          Phone calls aren&apos;t switched on yet. You can add people now; calls start as soon as they are.
        </p>
      )}
      {phone.available && locked && (
        <p className="mb-6 rounded-2xl bg-peri/25 px-4 py-3 text-[14px]">
          Real phone calls are on the Plus and Pro plans.{" "}
          <Link href="/app/billing" className="font-semibold underline underline-offset-4">
            See plans
          </Link>
        </p>
      )}

      <YourPhone phone={phone} />

      <section className="mt-8">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">People your agent can call</h2>
        {contacts.length === 0 ? (
          <div className="mt-3 rounded-[28px] bg-plate p-6 text-center ring-1 ring-line">
            <span className="mx-auto grid size-14 place-items-center rounded-[20px] bg-coral/30 text-[26px]">
              <UserPlus weight="fill" />
            </span>
            <p className="mt-4 font-display text-[22px] font-medium tracking-[-0.03em]">Add your first person</p>
            <p className="mx-auto mt-1 max-w-sm text-[15px] text-ink-soft">
              Your mum, a friend, anyone you&apos;d like to send a quick message to by voice. Then just say “call my mum
              and tell her I&apos;m fine”.
            </p>
            <button type="button" onClick={() => setAdding(true)} className={cn(btn.primary, "mt-5")}>
              <Plus weight="bold" /> Add someone
            </button>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {contacts.map((c) => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  canCall={phone.available && !locked && agents.length > 0}
                  onEdit={() => setEditing(c)}
                  onCall={() => setMessaging(c)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
        <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
          Calls come from{" "}
          {phone.caller_id ? <span className="font-mono">{spaced(phone.caller_id)}</span> : "the Callio number"}. Your
          agent says it&apos;s an AI calling for you, gives your message, and keeps it under two and a half minutes. If
          someone asks not to be called again, Callio stops.
        </p>
      </section>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add someone">
        {adding && <ContactForm existing={null} onDone={() => setAdding(false)} />}
      </Sheet>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.name}` : ""}>
        {editing && <ContactForm key={editing.id} existing={editing} onDone={() => setEditing(null)} />}
      </Sheet>
      <Sheet
        open={messaging !== null}
        onClose={() => setMessaging(null)}
        title={messaging ? `Call ${messaging.name}` : ""}
      >
        {messaging && (
          <MessageForm
            key={messaging.id}
            contact={messaging}
            agents={agents}
            timezone={user.timezone}
            onDone={() => setMessaging(null)}
          />
        )}
      </Sheet>
    </>
  );
}

// ---------- your own phone ----------

function YourPhone({ phone }: { phone: PhoneSettings }) {
  const router = useRouter();
  const [number, setNumber] = useState(phone.pending ?? "");
  const [code, setCode] = useState("");
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const usable = phone.available && phone.plan_allows;
  const waiting = Boolean(phone.pending) && !changing;

  const run = async (what: string, fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(what);
    setError(null);
    try {
      await fn();
      after?.();
      router.refresh();
    } catch (err) {
      setError(errorText(err, "That didn't work. Try again."));
    } finally {
      setBusy(null);
    }
  };
  const sendCode = (e?: React.FormEvent) => {
    e?.preventDefault();
    void run(
      "verify",
      () => api("/phone/verify", { method: "POST", body: { number } }),
      () => {
        setChanging(false);
        setCode("");
      },
    );
  };

  return (
    <section className="relative overflow-hidden rounded-[30px] bg-plate ring-1 ring-line">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute -right-12 -top-16 size-56 rounded-full bg-teal/40 blur-3xl dark:bg-teal/20" />
        <span className="absolute -bottom-24 right-28 size-48 rounded-full bg-peri/35 blur-3xl dark:bg-peri/20" />
      </div>
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-[20px] bg-teal/35 text-[26px]">
            <DeviceMobile weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[24px] leading-tight font-medium tracking-[-0.03em]">Your phone</p>
            <p className="mt-1 text-[15px] text-ink-soft">
              {phone.number
                ? "If you miss a call in the app, your agent rings this number instead."
                : "Add your number so a missed app call can ring your real phone. You can also call the Callio number from it to reach your agent."}
            </p>
          </div>
        </div>

        {phone.number && !changing ? (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-page/70 px-4 py-3 ring-1 ring-line">
              <span className="font-mono text-[16px]">{spaced(phone.number)}</span>
              <span className="rounded-full bg-teal/25 px-2 py-0.5 text-[12px] font-semibold">Confirmed</span>
              <span className="ml-auto flex gap-1">
                <button
                  type="button"
                  onClick={() => setChanging(true)}
                  className={cn(btn.soft, "h-9 px-3.5 text-[13px]")}
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => run("remove", () => api("/phone", { method: "DELETE" }))}
                  aria-label="Remove your number"
                  className={cn(btn.icon, "size-9 text-[17px] text-ink-soft hover:text-[#B0412C]")}
                >
                  {busy === "remove" ? <Spinner /> : <Trash />}
                </button>
              </span>
            </div>
            <Switch
              checked={phone.fallback}
              disabled={busy !== null}
              onChange={(v) => run("fallback", () => api("/phone", { method: "PATCH", body: { fallback: v } }))}
              label="Ring my phone when I miss an app call"
              hint="After about 40 seconds without an answer. Phone calls use 2 credits a minute and last up to 2½ minutes."
            />
          </div>
        ) : waiting ? (
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void run("confirm", () => api("/phone/confirm", { method: "POST", body: { code } }));
            }}
          >
            <p className="text-[14px]">
              We&apos;re calling <span className="font-mono">{spaced(phone.pending!)}</span> now. Pick up and type the
              code you hear.
            </p>
            <div className="flex gap-2">
              <input
                aria-label="Code from the call"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                className={cn(inputClass, "font-mono tracking-[0.3em]")}
              />
              <button
                type="submit"
                disabled={code.length !== 6 || busy !== null}
                className={cn(btn.primary, "shrink-0")}
              >
                {busy === "confirm" && <Spinner />} Confirm
              </button>
            </div>
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
              <button
                type="button"
                onClick={() => sendCode()}
                disabled={busy !== null}
                className="font-semibold underline-offset-4 hover:underline"
              >
                {busy === "verify" ? "Calling…" : "Call me again"}
              </button>
              <button
                type="button"
                onClick={() => setChanging(true)}
                className="font-semibold underline-offset-4 hover:underline"
              >
                Use a different number
              </button>
            </p>
          </form>
        ) : (
          <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={sendCode}>
            <input
              aria-label="Your phone number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="+49 170 1234567"
              disabled={!usable}
              className={cn(inputClass, "font-mono")}
            />
            <button
              type="submit"
              disabled={!usable || number.trim().length < 8 || busy !== null}
              className={cn(btn.primary, "shrink-0")}
            >
              {busy === "verify" ? <Spinner /> : <PhoneCall weight="fill" />} Call me with a code
            </button>
            {changing && (
              <button type="button" onClick={() => setChanging(false)} className={cn(btn.soft, "shrink-0")}>
                Cancel
              </button>
            )}
          </form>
        )}
        {error && (
          <p role="alert" className="mt-3 text-[14px] text-[#B0412C] dark:text-coral">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

// ---------- contacts ----------

function ContactCard({
  contact: c,
  canCall,
  onEdit,
  onCall,
}: {
  contact: Contact;
  canCall: boolean;
  onEdit: () => void;
  onCall: () => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex flex-col rounded-[24px] bg-plate p-5 ring-1 ring-line"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-full font-display text-[20px] font-medium",
            tintFor(c.name),
          )}
        >
          {c.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold">{c.name}</p>
          <p className="font-mono text-[13px] text-ink-soft">{spaced(c.phone)}</p>
          {(c.language || c.notes) && (
            <p className="mt-1 line-clamp-2 text-[13px] text-ink-soft">
              {[c.language && languageName(c.language), c.notes].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
      {c.opted_out && (
        <p className="mt-3 rounded-2xl bg-amber/25 px-3 py-2 text-[13px]">
          Asked not to be called by Callio. Edit to turn calls back on if they&apos;ve told you it&apos;s okay.
        </p>
      )}
      <div className="mt-auto flex items-center gap-2 pt-4">
        <button
          type="button"
          onClick={onCall}
          disabled={!canCall || c.opted_out}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-teal px-4 text-[14px] font-semibold text-[#0E0E10] transition-[background-color,transform] duration-200 hover:bg-[#58A7A4] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
        >
          <ChatCircleText weight="fill" /> Send a message
        </button>
        <button type="button" onClick={onEdit} className={cn(btn.soft, "h-10 px-4 text-[14px]")}>
          Edit
        </button>
      </div>
    </motion.li>
  );
}

const LANGUAGE_OPTIONS = [
  { value: "", label: "Whatever they answer in" },
  ...LANGUAGES.map((l) => ({
    value: l.code,
    label: l.label,
    keywords: l.name,
  })),
];

function ContactForm({ existing, onDone }: { existing: Contact | null; onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? "");
  const [number, setNumber] = useState(existing?.phone ?? "");
  const [language, setLanguage] = useState(existing?.language ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [allowAgain, setAllowAgain] = useState(false);
  const [busy, setBusy] = useState<"save" | "remove" | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("save");
    setError(null);
    const body: Record<string, unknown> = {
      name: name.trim(),
      phone: number,
      language: language || null,
      notes,
    };
    if (allowAgain) body.opted_out = false;
    try {
      if (existing) await api(`/contacts/${existing.id}`, { method: "PATCH", body });
      else await api("/contacts", { method: "POST", body });
      router.refresh();
      onDone();
    } catch (err) {
      setError(errorText(err, "Couldn't save. Try again."));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("remove");
    try {
      await api(`/contacts/${existing!.id}`, { method: "DELETE" });
      router.refresh();
      onDone();
    } catch (err) {
      setError(errorText(err, "Couldn't remove them. Try again."));
      setBusy(null);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Name" hint="What you call them. Your agent uses it to know who you mean.">
        {(id) => (
          <input
            id={id}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Mum"
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Phone number" hint="With the country code.">
        {(id) => (
          <input
            id={id}
            type="tel"
            inputMode="tel"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="+234 803 123 4567"
            className={cn(inputClass, "font-mono")}
          />
        )}
      </Field>
      <Field label="Language">
        {(id) => (
          <SelectMenu id={id} label="Language" value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS} />
        )}
      </Field>
      <Field label="Anything your agent should know" hint="Only used on calls to them.">
        {(id) => (
          <textarea
            id={id}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Call her Mummy. She likes to hear about work."
            className={cn(inputClass, "resize-none")}
          />
        )}
      </Field>
      {existing?.opted_out && (
        <Switch
          checked={allowAgain}
          onChange={setAllowAgain}
          label="They said it's okay to call again"
          hint="Only switch this on if they told you so themselves."
        />
      )}
      {error && (
        <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-3 text-[14px]">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        {existing &&
          (confirmRemove ? (
            <button type="button" onClick={remove} disabled={busy !== null} className={btn.danger}>
              {busy === "remove" && <Spinner />} Remove {existing.name} and their calls
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmRemove(true)} className={cn(btn.soft, "sm:mr-auto")}>
              <Trash /> Remove
            </button>
          ))}
        <button
          type="submit"
          disabled={busy !== null || !name.trim() || number.trim().length < 8}
          className={cn(btn.primary, "sm:ml-auto")}
        >
          {busy === "save" && <Spinner />} {existing ? "Save" : "Add"}
        </button>
      </div>
    </form>
  );
}

// ---------- a message call ----------

const WHEN = [
  { value: "now" as const, label: "Now" },
  { value: "later" as const, label: "Later" },
];
const REPEAT = [
  { value: "none" as const, label: "Once" },
  { value: "weekly" as const, label: "Every week" },
  { value: "daily" as const, label: "Every day" },
];

/** "YYYY-MM-DDTHH:MM" in the person's timezone, for a datetime-local input. */
function localNow(timezone: string, plusMinutes = 0) {
  const d = new Date(Date.now() + plusMinutes * 60_000);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function MessageForm({
  contact,
  agents,
  timezone,
  onDone,
}: {
  contact: Contact;
  agents: PersonalAgent[];
  timezone: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [timing, setTiming] = useState<"now" | "later">("now");
  const [at, setAt] = useState(() => localNow(timezone, 60));
  const [repeat, setRepeat] = useState<"none" | "weekly" | "daily">("none");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const agent = agents.find((a) => a.id === agentId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/contacts/${contact.id}/call`, {
        method: "POST",
        body: {
          agent_id: agentId,
          message,
          when: timing === "later" ? at : null,
          repeat: timing === "later" ? repeat : "none",
        },
      });
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(errorText(err, "Couldn't book the call. Try again."));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-teal/30 text-[26px]">
          <PhoneCall weight="fill" />
        </span>
        <p className="text-[16px]">
          {timing === "now"
            ? `${agent?.name ?? "Your agent"} is calling ${contact.name} now.`
            : `${agent?.name ?? "Your agent"} will call ${contact.name} then.`}{" "}
          You&apos;ll get a note with what they said.
        </p>
        <button type="button" onClick={onDone} className={cn(btn.primary, "w-full")}>
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label={`What should your agent tell ${contact.name}?`} hint="In your words. It's passed on as it is.">
        {(id) => (
          <textarea
            id={id}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="I'm doing well, work is busy but good, and I'll visit in December."
            className={cn(inputClass, "resize-none")}
          />
        )}
      </Field>
      {agents.length > 1 && (
        <Field label="Who calls">
          {(id) => (
            <SelectMenu
              id={id}
              label="Who calls"
              value={agentId}
              onChange={setAgentId}
              options={agents.map((a) => ({
                value: a.id,
                label: a.name,
                description: a.role,
              }))}
            />
          )}
        </Field>
      )}
      <Segmented label="When" value={timing} options={WHEN} onChange={setTiming} />
      <AnimatePresence initial={false}>
        {timing === "later" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <input
              aria-label="Date and time"
              type="datetime-local"
              value={at}
              min={localNow(timezone)}
              onChange={(e) => setAt(e.target.value)}
              className={cn(inputClass, "font-mono")}
            />
            <Segmented label="How often" value={repeat} options={REPEAT} onChange={setRepeat} />
          </motion.div>
        )}
      </AnimatePresence>
      {error && (
        <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-3 text-[14px]">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || !message.trim() || !agentId} className={cn(btn.call, "w-full")}>
        {busy ? <Spinner /> : <PhoneCall weight="fill" />}{" "}
        {timing === "now" ? `Call ${contact.name} now` : "Book the call"}
      </button>
    </form>
  );
}
