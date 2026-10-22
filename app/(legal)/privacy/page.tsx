import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, operatorAddress } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Callio collects, uses and protects your personal data, including call transcripts, memory and AI processing, and the rights you have under the GDPR.",
};

const SECTIONS = [
  { id: "summary", title: "The short version" },
  { id: "controller", title: "Who is responsible" },
  { id: "how-calls-work", title: "How calls and AI processing work" },
  { id: "what-we-collect", title: "What we collect" },
  { id: "purposes", title: "Why we use it and our legal bases" },
  { id: "google-data", title: "Google user data" },
  { id: "cookies", title: "Cookies and local storage" },
  { id: "retention", title: "How long we keep data" },
  { id: "recipients", title: "Who receives your data" },
  { id: "transfers", title: "International transfers" },
  { id: "rights", title: "Your rights" },
  { id: "automated-decisions", title: "Automated decisions" },
  { id: "children", title: "Children" },
  { id: "security", title: "Security" },
  { id: "us", title: "If you live in the United States" },
  { id: "nigeria", title: "If you live in Nigeria" },
  { id: "changes", title: "Changes to this policy" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function Heading({ id }: { id: SectionId }) {
  const section = SECTIONS.find((s) => s.id === id)!;
  return (
    <h2>
      <a href={`#${id}`}>{section.title}</a>
    </h2>
  );
}

function Contents() {
  return (
    <nav aria-label="On this page" className="mt-10 rounded-[28px] bg-plate p-6 ring-1 ring-line sm:p-7">
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-soft">On this page</p>
      <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="plain text-ink-soft hover:text-ink">
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const { operator, supervisoryAuthority, retention, app, age } = LEGAL;

export default function PrivacyPage() {
  return (
    <article>
      <p className="text-sm text-ink-soft">Last updated {LEGAL.lastUpdatedLabel}</p>
      <h1 className="mt-3 font-display text-[40px] font-medium leading-[1.05] tracking-[-0.035em] sm:text-[52px]">
        Privacy policy
      </h1>
      <p className="mt-5 text-[18px] text-ink-soft">
        Callio gives you AI voice agents you can talk to. That means we handle personal things: what you say,
        what your agents remember about you and when they should call. This page explains what we collect, why,
        who else is involved and what you can do about it.
      </p>

      <Contents />

      <div className="legal-prose">

      <section id="summary">
        <Heading id="summary" />
        <ul>
          <li>Your Callio agents are AI. They are not people.</li>
          <li>
            In-app call audio goes straight from your browser to Google’s Gemini AI. We don’t record audio. We keep
            a <strong>text transcript</strong> and a one-sentence summary so your agent can remember the call.
          </li>
          <li>We don’t sell your data and we don’t show ads. We only use analytics (Google Analytics) if you allow it in the cookie banner.</li>
          <li>We don’t use your conversations to train AI models.</li>
          <li>
            You can export your data or delete your account at any time in the app. Deletion removes your memory,
            transcripts and schedules within {retention.deletionDays} days.
          </li>
        </ul>
      </section>

      <section id="controller">
        <Heading id="controller" />
        <p>The controller responsible for your personal data under the EU General Data Protection Regulation (GDPR) is:</p>
        <p>
          {operator.legalName}
          <br />
          {operatorAddress}
          <br />
          Email: <a href={`mailto:${operator.privacyEmail}`}>{operator.privacyEmail}</a>
        </p>
        <p>
          For anything about your data, write to the email above. Full contact details are in our{" "}
          <Link href="/imprint">imprint</Link>.
        </p>
      </section>

      <section id="how-calls-work">
        <Heading id="how-calls-work" />
        <p>Here is what happens, in plain language, when you talk to an agent.</p>
        <h3>In-app calls</h3>
        <ul>
          <li>
            When you start a call, your browser asks for microphone access. Your voice is streamed{" "}
            <strong>directly from your browser to Google’s Gemini Live API</strong>. Our servers don’t receive the
            raw audio.
          </li>
          <li>
            Before the call, we give the AI the context it needs: your agent’s personality, things it remembers about
            you and anything scheduled. Google processes this to generate the agent’s replies.
          </li>
          <li>
            During and after the call, we store a <strong>text transcript</strong> of what was said and a
            one-sentence summary. We do not store audio recordings of your calls.
          </li>
          <li>
            Your agent may save short facts about you as “memory” (for example, your partner’s name or that you
            prefer morning calls). You can see and delete these.
          </li>
        </ul>
        <h3>Tools your agent can use</h3>
        <ul>
          <li>
            <strong>Web search.</strong> When you ask something that needs current information, the agent sends a
            search query through {LEGAL.webSearchProvider}.
          </li>
          <li>
            <strong>Weather.</strong> Only the place name is sent to Open-Meteo. Nothing that identifies you.
          </li>
          <li>
            <strong>Computer tasks</strong> (paid plans). An AI controls a cloud browser to fill in forms, book or
            compare things for you. The websites it visits receive whatever the task needs, such as your name for a
            booking. The agent never enters passwords or payment details, and it asks you to approve sensitive steps.
          </li>
          <li>
            <strong>Scheduled calls and reminders</strong> are delivered as Web Push notifications through your
            browser’s push service.
          </li>
        </ul>
        <h3>Phone calls</h3>
        <p>
          On paid plans your agent can ring your own phone, and call people you added on the Contacts page with a
          message from you. Call audio travels through our telephony provider, Twilio, to our server and on to
          Google’s Gemini API. Calls in Yoruba, Igbo or Hausa use Spitch for speech instead. The agent always says
          at the start that it is an AI calling for you, and the other person’s words become part of the
          transcript, which you can read and delete.
        </p>
        <p>
          To make an accurate transcript, our server holds the audio of a phone call in memory until the call ends,
          sends it to Google once to be transcribed, then deletes it. It is never written to disk or kept. Contacts
          can ask not to be called again, and Callio then stops calling them.
        </p>
        <h3>Sensitive topics</h3>
        <p>
          You decide what to tell your agent. If you share sensitive information, such as details about your health,
          we only use it to give you the conversation and memory you asked for. By choosing to share it, you give us
          your explicit consent to process it for that purpose (Art. 9(2)(a) GDPR). You can delete it at any time.
        </p>
      </section>

      <section id="what-we-collect">
        <Heading id="what-we-collect" />
        <ul>
          <li>
            <strong>Account data.</strong> When you sign in with Google, we receive your name, email address,
            profile picture and Google account ID. We don’t receive your Google password.
          </li>
          <li>
            <strong>Call content.</strong> Text transcripts of your calls, one-sentence summaries, call times and
            durations. Audio is processed by Google in real time but not stored by us.
          </li>
          <li>
            <strong>Memory.</strong> Facts your agents save about you, and any text you choose to import from
            another AI assistant (for example an export from ChatGPT, Claude or Gemini).
          </li>
          <li>
            <strong>Schedules.</strong> Calls and reminders you set up, with their times and topics.
          </li>
          <li>
            <strong>Push subscription.</strong> If you allow notifications, a push address for your browser and
            device.
          </li>
          <li>
            <strong>Computer tasks.</strong> Your instructions, the steps the agent took and the results.
          </li>
          <li>
            <strong>Usage and credits.</strong> Your plan, credit balance and how credits were used.
          </li>
          <li>
            <strong>Payment metadata.</strong> Stripe handles your payment. We receive limited information from
            Stripe, such as your customer ID, what you bought, the amount, the status and your country for tax. We
            never see your card details.
          </li>
          <li>
            <strong>Google Calendar (optional).</strong> If you connect it, access to the events on your primary
            calendar, so your agents can tell you what&apos;s on and, when you ask, add or move events. We store an
            encrypted access token, not a copy of your calendar.
          </li>
          <li>
            <strong>Technical logs.</strong> IP address, browser type, timestamps and error logs, which our hosting
            providers create when you use the site.
          </li>
        </ul>
      </section>

      <section id="purposes">
        <Heading id="purposes" />
        <p>We only use your data where the law gives us a reason (a “legal basis”).</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>What we do</th>
                <th>Legal basis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Create your account, run calls, keep transcripts, summaries and memory, run schedules and computer tasks</td>
                <td>Performance of our contract with you (Art. 6(1)(b) GDPR)</td>
              </tr>
              <tr>
                <td>Manage your plan, credits and purchases</td>
                <td>Contract (Art. 6(1)(b)) and legal obligations such as tax records (Art. 6(1)(c))</td>
              </tr>
              <tr>
                <td>Import memory from another AI assistant</td>
                <td>Your consent (Art. 6(1)(a)), given when you paste and confirm the import</td>
              </tr>
              <tr>
                <td>Measure how the website is used (Google Analytics)</td>
                <td>Your consent (Art. 6(1)(a) GDPR and §25(1) TDDDG), given in the cookie banner. Withdraw it any time with “Cookie settings” at the bottom of every page</td>
              </tr>
              <tr>
                <td>Send push notifications</td>
                <td>Your consent (Art. 6(1)(a)), given when you allow notifications</td>
              </tr>
              <tr>
                <td>Read and, when you ask, update your Google Calendar</td>
                <td>Your consent (Art. 6(1)(a)), given when you connect it</td>
              </tr>
              <tr>
                <td>Sensitive information you choose to share</td>
                <td>Your explicit consent (Art. 9(2)(a))</td>
              </tr>
              <tr>
                <td>Keep the service secure, prevent abuse and fraud, fix bugs using technical logs</td>
                <td>Our legitimate interest in a safe, working service (Art. 6(1)(f))</td>
              </tr>
              <tr>
                <td>Answer your messages and support requests</td>
                <td>Contract (Art. 6(1)(b)) or our legitimate interest in responding (Art. 6(1)(f))</td>
              </tr>
              <tr>
                <td>Defend or enforce legal claims</td>
                <td>Legitimate interest (Art. 6(1)(f))</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          You can withdraw consent at any time, for example by turning off notifications, disconnecting your
          calendar or deleting imported memory. This doesn’t affect processing that happened before.
        </p>
      </section>

      <section id="google-data">
        <Heading id="google-data" />
        <p>
          Callio&apos;s use and transfer to any other app of information received from Google APIs will adhere to
          the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <ul>
          <li>
            <strong>What we access.</strong> With Google sign-in: your name, email address and profile picture. If you
            connect Google Calendar: the events on your primary calendar (title, time, location, description, guests
            and video link), and permission to create events and change their times.
          </li>
          <li>
            <strong>How we use it.</strong> Only to provide features you use: signing you in, and letting your agents
            tell you about your schedule, prepare briefings you&apos;ve set up, and add or move events when you ask.
            Calendar details are passed to Google&apos;s Gemini API during your call so the agent can answer you.
          </li>
          <li>
            <strong>What we never do.</strong> We don&apos;t sell Google user data, use it for advertising, or use it
            to train or improve general AI or machine-learning models. People at Callio don&apos;t read it, unless you
            ask us to for support, it&apos;s needed for security or to investigate abuse, or the law requires it.
          </li>
          <li>
            <strong>Your control.</strong> Disconnect Google Calendar any time in the app under You, then
            Connections, or from your Google Account&apos;s third-party access page. We delete our access token
            straight away.
          </li>
        </ul>
      </section>

      <section id="cookies">
        <Heading id="cookies" />
        <p>These are strictly necessary to run Callio, so they don’t need consent under §25(2) TDDDG:</p>
        <ul>
          <li><strong>A session cookie</strong> that keeps you signed in.</li>
          <li><strong>Your theme and cookie choices</strong>, saved in your browser’s local storage.</li>
        </ul>
        <p>
          <strong>Analytics, only if you allow it.</strong> When you tap “Allow” in the cookie banner, we load Google
          Analytics 4. It sets first-party cookies (<code>_ga</code> and <code>_ga_*</code>, which last up to two years)
          and tells Google which pages you visit, your device and browser type and your approximate location. Google
          Analytics 4 doesn’t log or store IP addresses. We use the reports only to improve the website: no ads, no
          profiles, and it never sees your calls, memory or anything in your account. Google keeps the analytics data
          for up to 14 months. If you tap “No thanks”, Google Analytics never loads. You can change your mind any time
          with “Cookie settings” at the bottom of every page.
        </p>
        <p>We don’t use advertising cookies or any other third-party trackers.</p>
      </section>

      <section id="retention">
        <Heading id="retention" />
        <ul>
          <li>
            <strong>Account, memory, transcripts, summaries and schedules:</strong> for as long as you have an
            account, or until you delete them. You can delete individual items at any time.
          </li>
          <li>
            <strong>When you delete your account:</strong> we delete your memory, transcripts, schedules and account
            data within {retention.deletionDays} days. Records we must keep by law, such as tax and accounting
            records, are kept for the legally required period (in Germany usually up to 10 years). Most purchase
            records are kept by Stripe as merchant of record.
          </li>
          <li>
            <strong>Push subscriptions:</strong> until you turn off notifications or the browser invalidates them.
          </li>
          <li>
            <strong>Technical logs:</strong> {retention.logDays}, unless we need them longer to investigate a
            specific security incident.
          </li>
          <li>
            <strong>Audio:</strong> we don’t store call audio. Google processes audio to run the conversation under
            its API terms.
          </li>
        </ul>
      </section>

      <section id="recipients">
        <Heading id="recipients" />
        <p>
          We use a small number of service providers. Processors may only use your data on our instructions and
          under a data processing agreement. Independent controllers use data under their own privacy policies.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Purpose</th>
                <th>Data</th>
                <th>Location</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {LEGAL.subprocessors.map((p) => (
                <tr key={p.name}>
                  <td>
                    {p.name}
                    {p.status !== "active" && (
                      <span className="status">
                        {p.status === "may be used" ? "May be used" : "When phone calling launches"}
                      </span>
                    )}
                  </td>
                  <td>{p.purpose}</td>
                  <td>{p.data}</td>
                  <td>{p.location}</td>
                  <td>{p.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          We may also disclose data where the law requires it, for example to authorities with a valid legal order.
          We never sell your personal data.
        </p>
      </section>

      <section id="transfers">
        <Heading id="transfers" />
        <p>
          Some providers above process data in the United States or other countries outside the EU/EEA. For transfers
          to the US, we rely on the EU-US Data Privacy Framework where the provider is certified under it
          (Art. 45 GDPR). Otherwise, we use the European Commission’s Standard Contractual Clauses (Art. 46(2)(c)
          GDPR), plus extra safeguards where needed. You can ask us for a copy of the relevant safeguards.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Safeguard</th>
              </tr>
            </thead>
            <tbody>
              {LEGAL.subprocessors.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.safeguard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="rights">
        <Heading id="rights" />
        <p>Under the GDPR you have the right to:</p>
        <ul>
          <li>
            <strong>Access</strong> your data and get a copy (Art. 15).
          </li>
          <li>
            <strong>Rectify</strong> data that is wrong (Art. 16).
          </li>
          <li>
            <strong>Erase</strong> your data (Art. 17).
          </li>
          <li>
            <strong>Restrict</strong> how we process it (Art. 18).
          </li>
          <li>
            <strong>Portability</strong>: receive your data in a common, machine-readable format (Art. 20).
          </li>
          <li>
            <strong>Withdraw consent</strong> at any time, with effect for the future (Art. 7(3)).
          </li>
          <li>
            <strong>Complain</strong> to a data protection authority (Art. 77). You can contact the authority where
            you live or work, or ours: {supervisoryAuthority.name} ({supervisoryAuthority.url}).
          </li>
        </ul>
        <div className="callout">
          <p>
            <strong>Your right to object (Art. 21 GDPR).</strong> Where we process your data based on our legitimate
            interests (Art. 6(1)(f)), you can object at any time for reasons related to your particular situation.
            We will then stop unless we have compelling legitimate grounds or need the data for legal claims.
          </p>
        </div>
        <p>
          Many of these you can do yourself: export your data at <strong>{app.exportData}</strong> and delete your
          account at <strong>{app.deleteAccount}</strong>. For anything else, email{" "}
          <a href={`mailto:${operator.privacyEmail}`}>{operator.privacyEmail}</a>. We’ll reply within one month.
        </p>
      </section>

      <section id="automated-decisions">
        <Heading id="automated-decisions" />
        <p>
          Your agents are run by AI, and the AI decides what to say in a conversation. But we don’t make decisions
          about you based solely on automated processing that have legal effects on you or similarly significantly
          affect you (Art. 22 GDPR). We don’t profile you for advertising.
        </p>
      </section>

      <section id="children">
        <Heading id="children" />
        <p>
          Callio is not for children. You must be at least {age.minimum} years old to use it. If you are under{" "}
          {age.purchasesWithoutConsent}, you need permission from a parent or guardian to buy a plan or top-up. If you
          believe a child under {age.minimum} has given us personal data, contact us and we will delete it.
        </p>
      </section>

      <section id="security">
        <Heading id="security" />
        <p>
          We protect your data with technical and organisational measures that fit the risk, including encrypted
          connections (HTTPS), access controls, and keeping our software up to date. Sign-in happens through
          Google, so we never store a password for you. No system is perfectly secure. If a breach puts your rights at
          high risk, we will tell you without undue delay.
        </p>
      </section>

      <section id="us">
        <Heading id="us" />
        <p>
          If you live in California or another US state with a consumer privacy law, here is what you should know:
        </p>
        <ul>
          <li>
            <strong>We don’t sell or share your personal information</strong>, including for cross-context
            behavioural advertising, and we haven’t done so in the past 12 months.
          </li>
          <li>
            The categories of personal information we collect and why are described above under{" "}
            <a href="#what-we-collect">What we collect</a> and <a href="#purposes">Why we use it</a>.
          </li>
          <li>
            We only use sensitive personal information to provide the service you requested, not to infer
            characteristics about you.
          </li>
          <li>
            You can ask to know, access, correct or delete your personal information, and we won’t treat you
            differently for using these rights. Email{" "}
            <a href={`mailto:${operator.privacyEmail}`}>{operator.privacyEmail}</a>. You may use an authorised agent;
            we may need to verify your request.
          </li>
        </ul>
      </section>

      <section id="nigeria">
        <Heading id="nigeria" />
        <p>
          If you live in Nigeria, the Nigeria Data Protection Act 2023 (NDPA) gives you rights similar to those
          above. You can ask to be informed about, access, correct or delete your data, receive it in a portable
          format, object to processing, withdraw consent, and not be subject to decisions based solely on automated
          processing. Contact us at <a href={`mailto:${operator.privacyEmail}`}>{operator.privacyEmail}</a>. You can
          also complain to the Nigeria Data Protection Commission (NDPC). Transfers of your data outside Nigeria use
          the safeguards described under <a href="#transfers">International transfers</a>.
        </p>
      </section>

      <section id="changes">
        <Heading id="changes" />
        <p>
          We will update this policy when the product or the law changes, for example before phone calls launch. The
          date at the top shows the latest version. If a change matters to you, we will tell you by email or in the
          app before it takes effect.
        </p>
      </section>
      </div>
    </article>
  );
}
