// api/index.ts — Vercel serverless entry point
// server.ts already checks process.env.VERCEL and does not call app.listen() on Vercel.
// We just re-export the configured Express app as the default handler.
export { app as default } from '../server';
