import { redirect } from 'next/navigation';

export default function RemovedPromoCodesPage({ params }: { params: { eventSlug: string } }) {
  redirect(`/events/${params.eventSlug}`);
}
