export async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return;
  const { worker } = await import('./browser');
  return worker.start({ onUnhandledRequest: 'bypass' });
}
