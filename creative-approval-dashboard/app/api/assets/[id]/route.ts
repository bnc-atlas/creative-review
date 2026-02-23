import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  try {
    // Delete notes first (cascade delete)
    await prisma.creativeAssetNote.deleteMany({ where: { assetId: id } });
    // Then delete the asset
    await prisma.creativeAsset.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const body = await req.json();
  const { mediaUrl, adCopy, status } = body as { 
    mediaUrl?: string; 
    adCopy?: string; 
    status?: string;
  };

  try {
    const asset = await prisma.creativeAsset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl;
    if (adCopy !== undefined) updateData.adCopy = adCopy;
    
    let statusChanged = false;
    if (status !== undefined && status !== asset.status) {
      updateData.status = status;
      statusChanged = true;
    }

    // If status changed, create a note
    if (statusChanged) {
      let user = await prisma.user.findFirst({ where: { email: 'system@internal.local' } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: 'System User',
            email: 'system@internal.local',
          },
        });
      }

      updateData.notes = {
        create: {
          type: 'status_change',
          message: `Status changed to ${status}`,
          authorUserId: user.id,
        },
      };
    }

    const updated = await prisma.creativeAsset.update({
      where: { id },
      data: updateData,
      include: {
        notes: { orderBy: { createdAt: 'asc' }, include: { author: true } },
        createdBy: true,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
