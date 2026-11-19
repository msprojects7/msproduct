import { redirect } from 'next/navigation';

export default function OrganizationInvitationsRedirect({
  params,
}: {
  params: { orgSlug: string };
}) {
  redirect(`/organizations/${params.orgSlug}/members`);
}
