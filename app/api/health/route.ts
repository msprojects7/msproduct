import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();
    await db.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'ok',
      service: 'ms-backstage',
      database: 'connected',
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Database health check failed',
      },
      { status: 500 }
    );
  }
}
