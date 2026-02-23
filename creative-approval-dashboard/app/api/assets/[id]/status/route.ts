import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_STATUSES = ['queue', 'needs_revision', 'approved', 'live', 'disapproved'] as const;
type Status = (typeof VALID_STATUSES)[number];

const VALID_NOTE_TYPES = [
  'approval',
  'revision_request',
  'disapproval',
  'comment',
  'status_change',
] as const;
type NoteType = (typeof VALID_NOTE_TYPES)[number];

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  queue: ['approved', 'needs_revision', 'disapproved'],
  needs_revision: ['queue'],
  approved: ['live', 'disapproved', 'queue'],
  live: ['approved', 'queue'],
  disapproved: [],
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const body = await req.json();
  const { newStatus, note, noteType } = body as {
    newStatus: Status;
    note?: string;
    noteType?: NoteType;
  };

  const asset = await prisma.creativeAsset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[asset.status as Status] || [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
  }

  let finalNote = note;
  if (!finalNote) {
    if (noteType === 'approval') finalNote = 'Approved';
    else if (noteType === 'revision_request') finalNote = 'Revision requested';
    else if (noteType === 'disapproval') finalNote = 'Disapproved';
    else if (noteType === 'comment') finalNote = 'Comment added';
    else finalNote = 'Status changed';
  }

  let user = await prisma.user.findFirst({ where: { email: 'system@internal.local' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'System User',
        email: 'system@internal.local',
      },
    });
  }

  const updated = await prisma.creativeAsset.update({
    where: { id },
    data: {
      status: newStatus,
      notes: {
        create: {
          type: noteType,
          message: finalNote,
          authorUserId: user.id,
        },
      },
    },
    include: {
      notes: {
        orderBy: { createdAt: 'asc' },
        include: { author: true },
      },
      createdBy: true,
    },
  });

  return NextResponse.json(updated);
}
