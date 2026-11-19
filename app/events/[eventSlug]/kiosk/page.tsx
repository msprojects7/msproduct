import { redirect } from 'next/navigation';

export default function RemovedKioskPage({ params }: { params: { eventSlug: string } }) {
  redirect(`/events/${params.eventSlug}`);
}
