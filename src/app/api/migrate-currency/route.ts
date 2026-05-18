import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Migration not needed, database schema is fully native.'
  });
}
