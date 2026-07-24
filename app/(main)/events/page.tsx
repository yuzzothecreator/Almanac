import EventsView from "@/components/views/EventsView";
import { getEvents } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getEvents();
  return <EventsView events={events} />;
}
