import type { Metadata } from "next";
import { ContactsView } from "@/components/app/contacts";
import { personalize } from "@/lib/agents/personalize";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { Contact, PhoneSettings, UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Contacts" };

export default async function ContactsPage() {
  const user = (await currentUser())!;
  const call = await userBackend();
  const [phone, contacts, agents] = await Promise.all([
    call<PhoneSettings>("/v1/phone"),
    call<Contact[]>("/v1/contacts"),
    call<UserAgent[]>("/v1/agents"),
  ]);
  return <ContactsView user={user} phone={phone} contacts={contacts} agents={agents.map(personalize)} />;
}
