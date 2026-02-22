import { prisma } from '@/lib/prisma';
import SuperAdminClient from './SuperAdminClient';

// Force dynamic rendering to ensure stats are always up to date
export const revalidate = 0; 

export default async function SuperAdminPage() {
  const shops = await prisma.shop.findMany({ orderBy: { createdAt: 'desc' } });
  const invites = await prisma.invite.findMany({ orderBy: { createdAt: 'desc' } });
  const users = await prisma.user.findMany({ orderBy: { id: 'desc' } });

  return <SuperAdminClient shops={shops} invites={invites} users={users} />;
}