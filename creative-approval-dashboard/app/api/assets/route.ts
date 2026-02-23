import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_STATUSES = ['queue', 'needs_revision', 'approved', 'live', 'disapproved'] as const;
type Status = (typeof VALID_STATUSES)[number];

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  queue: ['approved', 'needs_revision', 'disapproved'],
  needs_revision: ['queue'],
  approved: ['live', 'disapproved', 'queue'],
  live: ['approved'],
  disapproved: [],
};

const VALID_NOTE_TYPES = [
  'approval',
  'revision_request',
  'disapproval',
  'comment',
  'status_change',
] as const;
type NoteType = (typeof VALID_NOTE_TYPES)[number];

// GET /api/assets?status=queue&product=JIRA&product=CONFLUENCE&platform=GOOGLE
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const status = VALID_STATUSES.includes(statusParam as Status)
    ? (statusParam as Status)
    : null;
  const products = searchParams.getAll('product');
  const platforms = searchParams.getAll('platform');

  const where: any = {};
  if (status) where.status = status;
  if (products.length > 0) where.product = { in: products };
  if (platforms.length > 0)
    where.platforms = {
      contains: platforms.join(','),
    };

  const assets = await prisma.creativeAsset.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      notes: {
        orderBy: { createdAt: 'asc' },
        include: { author: true },
      },
      createdBy: true,
    },
  });

  return NextResponse.json(assets);
}

// POST /api/assets
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mediaUrl, adCopy, product, platforms } = body as {
    mediaUrl: string;
    adCopy: string;
    product: string;
    platforms: string[];
  };

  if (!mediaUrl || !adCopy || !product || !platforms || platforms.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

  const asset = await prisma.creativeAsset.create({
    data: {
      mediaUrl,
      adCopy,
      product,
      platforms: platforms.join(','),
      status: 'queue',
      createdByUserId: user.id,
      notes: {
        create: {
          type: 'status_change' as NoteType,
          message: 'Asset created and added to queue',
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

  return NextResponse.json(asset, { status: 201 });
}
