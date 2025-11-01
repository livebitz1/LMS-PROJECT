import serverEvents from '@/lib/events';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));

      const approvalHandler = (payload: unknown) => send({ type: 'approval_changed', payload });
      const docsHandler = (payload: unknown) => send({ type: 'docs_reuploaded', payload });

      serverEvents.on('approval_changed', approvalHandler);
      serverEvents.on('docs_reuploaded', docsHandler);

      // cleanup on client disconnect
      req.signal?.addEventListener?.('abort', () => {
        serverEvents.off('approval_changed', approvalHandler);
        serverEvents.off('docs_reuploaded', docsHandler);
      });
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
