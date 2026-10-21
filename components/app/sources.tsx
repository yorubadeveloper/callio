"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowClockwise,
  ChartLineUp,
  Globe,
  HardDrives,
  Plus,
  PlugsConnected,
  Trash,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { when } from "@/lib/format";
import type { Connector, ConnectorKind } from "@/lib/types";
import { Spinner } from "@/components/brand/logo-loader";
import { btn, Field, inputClass, Segmented, Sheet, Switch } from "./ui";

// Sources an agent can watch and talk about: sites, servers, analytics and any MCP server. Each one is tested
// before it's saved, keys are encrypted on the server and never come back, and everything is read-only unless
// the person switches a tool on.

export const KIND: Record<ConnectorKind, { name: string; what: string; icon: Icon; tint: string }> = {
  analytix: {
    name: "Analytix",
    what: "Traffic, top pages, sources and revenue for your websites.",
    icon: ChartLineUp,
    tint: "bg-coral/25",
  },
  dokploy: {
    name: "Servers",
    what: "Your apps and deploys: what's running, what failed.",
    icon: HardDrives,
    tint: "bg-peri/30",
  },
  website: {
    name: "Website monitor",
    what: "Checks your sites every few minutes and tells you when one goes down.",
    icon: Globe,
    tint: "bg-teal/25",
  },
  mcp: {
    name: "Custom connector",
    what: "Any MCP server: Sentry, Linear, Stripe, Notion, or your own.",
    icon: PlugsConnected,
    tint: "bg-amber/30",
  },
};

const ORDER: ConnectorKind[] = ["analytix", "dokploy", "website", "mcp"];

const ALERTS = [
  { value: "off" as const, label: "Off" },
  { value: "notify" as const, label: "Notify me" },
  { value: "call" as const, label: "Call me" },
];

export function Sources({
  connectors,
  timezone,
  locale,
}: {
  connectors: Connector[];
  timezone: string;
  locale: string;
}) {
  const [adding, setAdding] = useState<ConnectorKind | null>(null);
  const [editing, setEditing] = useState<Connector | null>(null);
  // Analytix and Servers are one per account in practice; sites and custom connectors can repeat.
  const addable = ORDER.filter((k) => k === "website" || k === "mcp" || !connectors.some((c) => c.kind === k));

  return (
    <section>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Sites and servers</h2>
      {connectors.length > 0 && (
        <ul className="mt-3 grid grid-cols-1 gap-3">
          <AnimatePresence initial={false}>
            {connectors.map((c) => (
              <ConnectorCard
                key={c.id}
                connector={c}
                timezone={timezone}
                locale={locale}
                onEdit={() => setEditing(c)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
      <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", connectors.length > 0 && "mt-4")}>
        {addable.map((kind) => {
          const k = KIND[kind];
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setAdding(kind)}
              className="group flex items-start gap-3 rounded-[22px] bg-plate p-4 text-left ring-1 ring-line transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgb(0_0_0/0.5)]"
            >
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl text-[20px]", k.tint)}>
                <k.icon weight="fill" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 text-[15px] font-semibold">
                  {k.name}
                  <Plus weight="bold" className="text-ink-soft transition-transform group-hover:rotate-90" />
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">{k.what}</span>
              </span>
            </button>
          );
        })}
      </div>
      <ConnectorSheet kind={adding} onClose={() => setAdding(null)} />
      <ConnectorSheet kind={editing?.kind ?? null} existing={editing} onClose={() => setEditing(null)} />
    </section>
  );
}

function StatusDot({ status }: { status: Connector["status"] }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        status === "ok" ? "bg-teal" : status === "error" ? "bg-coral" : "bg-ink/25",
      )}
    />
  );
}

function ConnectorCard({
  connector: c,
  timezone,
  locale,
  onEdit,
}: {
  connector: Connector;
  timezone: string;
  locale: string;
  onEdit: () => void;
}) {
  const router = useRouter();
  const k = KIND[c.kind];
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showTools, setShowTools] = useState(false);

  const run = async (what: string, fn: () => Promise<unknown>) => {
    setBusy(what);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That didn't work. Try again.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };
  const patch = (body: Record<string, unknown>) =>
    run("save", () => api(`/connectors/${c.id}`, { method: "PATCH", body }));
  const watched = c.kind === "website" || c.kind === "dokploy";
  const changeable = c.tools?.filter((t) => !t.read_only) ?? [];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="rounded-[24px] bg-plate p-5 ring-1 ring-line"
    >
      <div className="flex items-start gap-3">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl text-[22px]", k.tint)}>
          <k.icon weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold">{c.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-soft">
            <StatusDot status={c.status} />
            <span className="truncate">
              {c.status === "error" ? (c.last_error ?? "Not answering") : (c.summary ?? "Connected")}
              {c.last_checked_at && ` · checked ${when(c.last_checked_at, timezone, locale).toLowerCase()}`}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => run("test", () => api(`/connectors/${c.id}/test`, { method: "POST" }))}
          aria-label={`Check ${c.name} now`}
          className={cn(btn.icon, "size-10 shrink-0 text-[18px]")}
        >
          {busy === "test" ? <Spinner /> : <ArrowClockwise weight="bold" />}
        </button>
      </div>

      {c.kind === "website" && c.sites && c.sites.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-2xl bg-page/60 ring-1 ring-line">
          {c.sites.map((s) => (
            <li key={s.url} className="flex items-center gap-3 px-3.5 py-2.5 text-[14px]">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[12px] font-semibold",
                  s.up ? (s.slow ? "bg-amber/35" : "bg-teal/25") : "bg-coral/25",
                )}
              >
                {s.up ? (s.slow ? "Slow" : "Up") : "Down"}
              </span>
              <span className="min-w-0 flex-1 truncate">{s.url.replace(/^https?:\/\//, "")}</span>
              {s.ms != null && <span className="shrink-0 font-mono text-[12px] text-ink-soft">{s.ms} ms</span>}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-3 border-t border-line pt-3">
        <Switch
          checked={c.in_briefing}
          onChange={(v) => patch({ in_briefing: v })}
          label="In my morning call"
          hint={c.kind === "mcp" ? "Your agent can always ask it things when you do." : undefined}
        />
        {watched && (
          <div>
            <p className="text-[14px] font-semibold">When something breaks</p>
            <div className="mt-2">
              <Segmented
                label="When something breaks"
                value={c.alerts}
                options={ALERTS}
                onChange={(v) => patch({ alerts: v })}
              />
            </div>
          </div>
        )}
        {c.tools && c.tools.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowTools((s) => !s)}
              aria-expanded={showTools}
              className="min-h-11 text-[14px] font-semibold text-ink underline-offset-4 hover:underline"
            >
              {showTools ? "Hide tools" : `See its ${c.tools.length} tools`}
              {changeable.length > 0 && !showTools && (
                <span className="ml-2 font-normal text-ink-soft">
                  {changeable.filter((t) => t.allowed).length} of {changeable.length} that change things on
                </span>
              )}
            </button>
            <AnimatePresence initial={false}>
              {showTools && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {c.tools.map((t) => (
                    <li key={t.name} className="border-t border-line py-1 first:border-t-0">
                      {t.read_only ? (
                        <div className="flex min-h-11 items-center justify-between gap-4">
                          <span className="min-w-0">
                            <span className="block font-mono text-[13px]">{t.name}</span>
                            {t.description && (
                              <span className="block truncate text-[12px] text-ink-soft">{t.description}</span>
                            )}
                          </span>
                          <span className="shrink-0 rounded-full bg-teal/20 px-2 py-0.5 text-[12px] font-semibold">
                            Reads only
                          </span>
                        </div>
                      ) : (
                        <Switch
                          checked={t.allowed}
                          label={t.name}
                          hint={t.description || "Can change things. Your agent asks you before using it."}
                          onChange={(on) =>
                            patch({
                              allowed_tools: changeable
                                .filter((x) => (x.name === t.name ? on : x.allowed))
                                .map((x) => x.name),
                            })
                          }
                        />
                      )}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-[14px] text-[#B0412C] dark:text-coral">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={onEdit} className={cn(btn.soft, "h-10 px-4 text-[14px]")}>
          Edit
        </button>
        {confirmRemove ? (
          <>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              className={cn(btn.soft, "h-10 px-4 text-[14px]")}
            >
              Keep
            </button>
            <button
              type="button"
              disabled={busy === "remove"}
              onClick={() => run("remove", () => api(`/connectors/${c.id}`, { method: "DELETE" }))}
              className={cn(btn.danger, "h-10 px-4 text-[14px]")}
            >
              {busy === "remove" && <Spinner />} Remove and delete the key
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label={`Remove ${c.name}`}
            className={cn(btn.icon, "ml-auto size-10 text-[18px] text-ink-soft hover:text-[#B0412C]")}
          >
            <Trash />
          </button>
        )}
      </div>
    </motion.li>
  );
}

const HELP: Record<ConnectorKind, React.ReactNode> = {
  analytix: (
    <>
      In Analytix, open{" "}
      <a href="https://analytix.wtf/app" target="_blank" rel="noreferrer" className="font-semibold underline">
        your property
      </a>{" "}
      → MCP, create a key, and paste it here. It starts with <span className="font-mono">ax_</span>.
    </>
  ),
  dokploy: (
    <>
      In your server panel, go to Settings → Profile → API/CLI and generate a key. Callio only reads your projects, apps and
      deploys.
    </>
  ),
  website: <>Add up to 10 addresses. Callio checks them every 5 minutes and tells you only if one stays down.</>,
  mcp: (
    <>
      Any MCP server reachable over the internet. Tools that only read are on; anything that can change things stays
      off until you switch it on.
    </>
  ),
};

function ConnectorSheet({
  kind,
  existing,
  onClose,
}: {
  kind: ConnectorKind | null;
  existing?: Connector | null;
  onClose: () => void;
}) {
  const open = kind !== null && (existing === undefined || existing !== null);
  return (
    <Sheet open={open} onClose={onClose} title={kind ? (existing ? `Edit ${existing.name}` : KIND[kind].name) : ""}>
      {kind && <ConnectorForm key={existing?.id ?? kind} kind={kind} existing={existing ?? null} onDone={onClose} />}
    </Sheet>
  );
}

function ConnectorForm({
  kind,
  existing,
  onDone,
}: {
  kind: ConnectorKind;
  existing: Connector | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? "");
  const [url, setUrl] = useState(existing?.url ?? "");
  const [secret, setSecret] = useState("");
  const [urls, setUrls] = useState<string[]>(existing?.urls?.length ? existing.urls : [""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body: Record<string, unknown> = {};
    if (kind === "mcp" && name.trim()) body.name = name.trim();
    if (kind === "dokploy" || kind === "mcp") body.url = url.trim();
    if (secret.trim()) body.secret = secret.trim();
    if (kind === "website") body.urls = urls.map((u) => u.trim()).filter(Boolean);
    try {
      if (existing) await api(`/connectors/${existing.id}`, { method: "PATCH", body });
      else await api("/connectors", { method: "POST", body: { kind, ...body } });
      router.refresh();
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't connect. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const keyHint = existing?.has_secret ? "Leave empty to keep the saved key." : undefined;

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-[14px] leading-relaxed text-ink-soft">{HELP[kind]}</p>

      {kind === "mcp" && (
        <Field label="Name" hint="What you'll call it on a call, like “Sentry”.">
          {(id) => (
            <input id={id} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} />
          )}
        </Field>
      )}
      {(kind === "dokploy" || kind === "mcp") && (
        <Field label={kind === "dokploy" ? "Panel address" : "Server address"}>
          {(id) => (
            <input
              id={id}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder={kind === "dokploy" ? "https://panel.yourdomain.com" : "https://mcp.example.com/mcp"}
              required
              className={inputClass}
            />
          )}
        </Field>
      )}
      {kind !== "website" && (
        <Field
          label={kind === "mcp" ? "Key or token (if it needs one)" : "API key"}
          hint={keyHint ?? "Encrypted on our server. It's never shown again, not even to your agent."}
        >
          {(id) => (
            <input
              id={id}
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              required={!existing && kind !== "mcp"}
              placeholder={kind === "analytix" ? "ax_…" : undefined}
              className={cn(inputClass, "font-mono")}
            />
          )}
        </Field>
      )}
      {kind === "website" && (
        <fieldset>
          <legend className="text-[14px] font-semibold">Addresses to watch</legend>
          <div className="mt-2 space-y-2">
            {urls.map((u, i) => (
              <div key={i} className="flex gap-2">
                <input
                  aria-label={`Address ${i + 1}`}
                  value={u}
                  onChange={(e) => setUrls((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
                  inputMode="url"
                  spellCheck={false}
                  placeholder="https://yoursite.com"
                  className={inputClass}
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setUrls((all) => all.filter((_, j) => j !== i))}
                    aria-label={`Remove address ${i + 1}`}
                    className={cn(btn.icon, "shrink-0 self-center")}
                  >
                    <X />
                  </button>
                )}
              </div>
            ))}
          </div>
          {urls.length < 10 && (
            <button
              type="button"
              onClick={() => setUrls((all) => [...all, ""])}
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold"
            >
              <Plus weight="bold" /> Add another
            </button>
          )}
        </fieldset>
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-3 text-[14px]">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={cn(btn.primary, "w-full")}>
        {busy && <Spinner />} {busy ? "Checking it works…" : existing ? "Save" : "Connect"}
      </button>
    </form>
  );
}
