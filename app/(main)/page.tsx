import HomeView from "@/components/views/HomeView";
import {
  getActiveAlmanac,
  getDemoUser,
  getEvents,
  getRegistrationCount,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [events, user, registrationCount, almanac] = await Promise.all([
    getEvents(),
    getDemoUser(),
    getRegistrationCount(),
    getActiveAlmanac(),
  ]);

  return (
    <HomeView
      events={events}
      user={user}
      registrationCount={registrationCount}
      almanac={almanac}
    />
  );
}
