import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brain, CalendarBlank, Phone, Plus, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { AgentCard } from "@/components/app/agent-card";
import { AgentFace } from "@/components/landing/agent-face";
import { personalize } from "@/lib/agents/personalize";
import { SKILLS, planAllows } from "@/lib/agents/skills";
import { duration, greeting, when } from "@/lib/format";
import { plan } from "@/lib/pricing";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { Call, Highlights, UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const user = (await currentUser())!;
  const call = await userBackend();
  const [agents, highlights, calls] = await Promise.all([
    call<UserAgent[]>("/v1/agents"),
    call<Highlights>("/v1/me/highlights"),
    call<Call[]>("/v1/calls?limit=5"),
  ]);
  const people = agents.map(personalize);
  const byId = new Map(people.map((a) => [a.id, a]));
  const featured = (calls[0] && byId.get(calls[0].agent_id)) || people[0];
  const lastTalked = (id: string) => {
    const c = calls.find((x) => x.agent_id === id);
    return c ? when(c.started_at, user.timezone, user.locale).toLowerCase() : null;
  };
  const name = user.nickname || user.name.split(" ")[0];
  const limit = plan(user.plan).agents;
  const canAdd = limit === "unlimited" || agents.length < limit;
  const suggestions = SKILLS.filter((s) => s.status === "live" && planAllows(user.plan, s.minPlan)).flatMap(
    (s) => s.examples[0],
  );

  return (
    <div className="space-y-10">
      {/* phone: a quiet greeting */}
      <header className="lg:hidden">
        <p className="text-[15px] text-ink-soft">{greeting(user.timezone)},</p>
        <h1 className="font-display text-[clamp(2.4rem,8vw,3.5rem)] leading-[1] font-medium tracking-[-0.045em]">
          {name}
        </h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          {highlights.calls_this_week
            ? `${highlights.calls_this_week} ${highlights.calls_this_week === 1 ? "call" : "calls"} this week`
            : "No calls yet this week"}
          {highlights.streak_days > 1 && ` · ${highlights.streak_days}-day streak`}
          {` · ${highlights.memories} things remembered`}
        </p>
      </header>

      {/* desktop: greeting plus one tap to the agent you talk to most */}
      {featured && (
        <section className="relative hidden overflow-hidden rounded-[32px] bg-[#121212] p-10 text-[#F3F2EE] lg:block">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div
              className="aurora-a absolute -right-24 -top-32 size-[28rem] rounded-full opacity-40 blur-[90px]"
              style={{ background: featured.face.skin }}
            />
            <div
              className="aurora-b absolute -bottom-40 right-1/3 size-[22rem] rounded-full opacity-25 blur-[90px]"
              style={{ background: featured.face.tile }}
            />
          </div>
          <div className="relative flex items-center justify-between gap-10">
            <div>
              <p className="text-[16px] text-white/60">{greeting(user.timezone)},</p>
              <h1 className="font-display text-[64px] leading-[1] font-medium tracking-[-0.045em]">{name}</h1>
              <p className="mt-4 text-[15px] text-white/60">
                {highlights.calls_this_week
                  ? `${highlights.calls_this_week} ${highlights.calls_this_week === 1 ? "call" : "calls"} this week`
                  : "No calls yet this week"}
                {highlights.streak_days > 1 && ` · ${highlights.streak_days}-day streak`}
                {` · ${highlights.memories} things remembered`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-5">
              <span className="relative size-24">
                <span
                  className="ring-pulse absolute inset-0 rounded-full border-2"
                  style={{ borderColor: featured.face.skin }}
                />
                <span className="relative block size-full overflow-hidden rounded-full ring-4 ring-white/10">
                  <AgentFace agent={featured} className="size-full" />
                </span>
              </span>
              <div>
                <p className="text-[14px] text-white/60">{featured.role}</p>
                <Link
                  href={`/call/${featured.id}`}
                  className="mt-2 inline-flex h-12 items-center gap-2 rounded-full bg-teal px-6 text-[16px] font-semibold text-[#0E0E10] shadow-[0_10px_30px_-10px_#64B2AF] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <Phone weight="fill" /> Call {featured.name}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-[22px] font-medium tracking-[-0.03em]">Your agents</h2>
          {canAdd && (
            <Link
              href="/app/agents/new"
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold hover:bg-ink/[0.05]"
            >
              <Plus weight="bold" /> New agent
            </Link>
          )}
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {people.map((a) => (
            <div key={a.id} className="w-[72%] shrink-0 snap-start sm:w-auto">
              <AgentCard agent={a} lastTalked={lastTalked(a.id)} />
            </div>
          ))}
          {canAdd && (
            <Link
              href="/app/agents/new"
              className="hidden min-h-[248px] flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-line text-ink-soft transition-colors hover:border-ink/30 hover:text-ink sm:flex"
            >
              <span className="grid size-14 place-items-center rounded-full bg-ink/[0.05] text-[22px]">
                <Plus weight="bold" />
              </span>
              <span className="text-[15px] font-semibold">New agent</span>
              <span className="max-w-[14rem] text-center text-[13px]">
                Someone for meetings, errands, family or a language.
              </span>
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="rounded-[28px] bg-plate p-5 ring-1 ring-line sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-ink-soft">
              <CalendarBlank weight="bold" /> Coming up
            </h2>
            <Link href="/app/upcoming" className="text-[14px] font-semibold text-ink-soft hover:text-ink">
              See all
            </Link>
          </div>
          {highlights.next_schedule ? (
            <div className="mt-4 flex items-center gap-3">
              {byId.get(highlights.next_schedule.agent_id) && (
                <span className="size-11 shrink-0 overflow-hidden rounded-full">
                  <AgentFace agent={byId.get(highlights.next_schedule.agent_id)!} className="size-full" />
                </span>
              )}
              <div>
                <p className="text-[16px] font-semibold">{highlights.next_schedule.text}</p>
                <p className="text-[14px] text-ink-soft">
                  {highlights.next_schedule.type === "call" ? "Call" : "Reminder"} ·{" "}
                  {when(highlights.next_schedule.when, user.timezone, user.locale)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[15px] text-ink-soft">
              Nothing scheduled. On a call, try “Call me tomorrow at 8 with my plan for the day.”
            </p>
          )}
        </section>

        <section className="rounded-[28px] bg-plate p-5 ring-1 ring-line sm:p-6">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-ink-soft">
            <Sparkle weight="bold" /> Try saying
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {suggestions.slice(0, 6).map((s) => (
              <li key={s} className="rounded-full bg-ink/[0.05] px-3.5 py-2 text-[14px]">
                “{s}”
              </li>
            ))}
          </ul>
        </section>
      </div>

      {!user.integrations?.google_calendar?.connected && (
        <Link
          href="/app/you#connections"
          className="group flex items-center gap-4 rounded-[28px] bg-teal/20 p-5 ring-1 ring-teal/40 transition-colors hover:bg-teal/30 sm:p-6"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-teal text-[22px] text-[#121212]">
            <CalendarBlank weight="fill" />
          </span>
          <span className="flex-1">
            <span className="block text-[16px] font-semibold">Connect your calendar</span>
            <span className="block text-[14px] text-ink-soft">
              So {featured?.name ?? "your agents"} can brief you on your day and move meetings when you ask.
            </span>
          </span>
          <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      {highlights.memories < 5 && (
        <Link
          href="/app/memory?import=1"
          className="group flex items-center gap-4 rounded-[28px] bg-peri/25 p-5 ring-1 ring-peri/40 transition-colors hover:bg-peri/35 sm:p-6"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-peri text-[22px] text-[#121212]">
            <Brain weight="fill" />
          </span>
          <span className="flex-1">
            <span className="block text-[16px] font-semibold">Help your agents know you faster</span>
            <span className="block text-[14px] text-ink-soft">
              Bring over what ChatGPT, Claude or Gemini already know about you.
            </span>
          </span>
          <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-[22px] font-medium tracking-[-0.03em]">Recent calls</h2>
          {calls.length > 0 && (
            <Link href="/app/calls" className="text-[14px] font-semibold text-ink-soft hover:text-ink">
              See all
            </Link>
          )}
        </div>
        {calls.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-[28px] bg-plate ring-1 ring-line">
            {calls.map((c) => {
              const a = byId.get(c.agent_id);
              return (
                <li key={c.id}>
                  <Link
                    href={`/app/calls/${c.id}`}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-ink/[0.03]"
                  >
                    {a && (
                      <span className="size-10 shrink-0 overflow-hidden rounded-full">
                        <AgentFace agent={a} className="size-full" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">
                        {c.summary ?? `Call with ${a?.name ?? "your agent"}`}
                      </span>
                      <span className="block text-[13px] text-ink-soft">
                        {a?.name} · {when(c.started_at, user.timezone, user.locale)} · {duration(c.seconds)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-[28px] bg-plate p-6 text-[15px] text-ink-soft ring-1 ring-line">
            Your calls will show up here, with a summary of what you talked about.
          </p>
        )}
      </section>
    </div>
  );
}
