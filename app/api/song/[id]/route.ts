import { NextRequest, NextResponse } from 'next/server';
import { getSongById } from '@/lib/data/songs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const song = getSongById(id);

  if (!song) {
    return NextResponse.json({ error: 'Song not found' }, { status: 404 });
  }

  return NextResponse.json(song);
}
