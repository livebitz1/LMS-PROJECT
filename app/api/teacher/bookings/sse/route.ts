import serverEvents from '@/lib/events';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
      const handler = (payload: unknown) => send({ type: 'booking_updated', payload });
      serverEvents.on('booking_updated', handler);
      // cleanup on abort
      req.signal?.addEventListener?.('abort', () => serverEvents.off('booking_updated', handler));
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}
