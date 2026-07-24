import HomeView from "@/components/views/HomeView";
import { getActiveAlmanac, getEvents, getRegistrationCount } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [events, registrationCount, almanac] = await Promise.all([
    getEvents(),
    getRegistrationCount(),
    getActiveAlmanac(),
  ]);

  return (
    <HomeView
      events={events}
      registrationCount={registrationCount}
      almanac={almanac}
    />
  );
}
