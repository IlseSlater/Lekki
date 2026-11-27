/**
 * First operator on an empty database. Creates one organisation, its one venue, and one owner login.
 * No menus, tables, or demo staff. Studio onboarding creates those.
 *
 *   OWNER_EMAIL=you@example.com OWNER_PASSWORD='long-password' ORG_NAME='Your business' \
 *     pnpm exec tsx scripts/create-owner.ts
 *
 * Refuses to run when an organisation already exists, so it never adds a second owner by accident.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const OWNER_PERMISSIONS = [
  'organisation.manage',
  'session.read',
  'session.close',
  'fulfilment.read',
  'fulfilment.update',
  'payment.complete',
  'staff.service',
];

async function main() {
  const email = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD || '';
  const orgName = (process.env.ORG_NAME || '').trim();
  const displayName = (process.env.OWNER_NAME || 'Owner').trim();

  if (!email || !email.includes('@')) throw new Error('Set OWNER_EMAIL.');
  if (password.length < 12) throw new Error('Set OWNER_PASSWORD (12+ characters).');
  if (!orgName) throw new Error('Set ORG_NAME.');

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.organisation.count();
    if (existing > 0) {
      throw new Error('An organisation already exists. Refusing to create a second owner.');
    }
    const org = await prisma.organisation.create({
      data: { id: `org_${randomUUID()}`, name: orgName },
    });
    await prisma.staffMember.create({
      data: {
        id: `staff_${randomUUID()}`,
        organisationId: org.id,
        displayName,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'manager',
        permissions: OWNER_PERMISSIONS,
      },
    });
    // Setup needs one venue to hang places, menu, and QR on. It carries the business name until the
    // owner renames it in "Your place". No tables, menu, or staff are added.
    await prisma.venue.create({
      data: { id: `venue_${randomUUID()}`, organisationId: org.id, name: orgName },
    });
    console.log(`Created organisation "${orgName}", its venue, and owner ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
