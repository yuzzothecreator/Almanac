import CalendarView from "@/components/views/CalendarView";
import { getEvents } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const events = await getEvents();
  return <CalendarView events={events} />;
}
