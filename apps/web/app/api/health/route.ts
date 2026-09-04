export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'edukriti-web',
    timestamp: new Date().toISOString(),
  });
}
