import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Simple query to verify database connection
    // This queries the built-in Supabase health check
    const { error } = await supabase.from('_health_check').select('*').limit(1)

    // If we get a "relation does not exist" error, that's fine -
    // it means we connected to Supabase successfully
    if (error && !error.message.includes('does not exist')) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      supabase: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
