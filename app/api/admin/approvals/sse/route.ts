import serverEvents from '@/lib/events';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
      const handler = (payload: unknown) => send({ type: 'approval_changed', payload });
      serverEvents.on('approval_changed', handler);
      // cleanup on client disconnect
      req.signal?.addEventListener?.('abort', () => serverEvents.off('approval_changed', handler));
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
