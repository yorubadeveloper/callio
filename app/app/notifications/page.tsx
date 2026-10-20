import { redirect } from "next/navigation";

// Reminder and recap notifications link here; they now live on Upcoming.
export default function NotificationsPage() {
  redirect("/app/upcoming#recent");
}
