```ts
import request from 'supertest';
import server from './server';

describe('Server', () => {
  it('responds to GET /', async () => {
    const res = await request(server).get('/');
    expect(res.status).toBe(200);
  });
});
```
(Note: No changes were required in `src/server.test.ts`; the added Jest configuration and dependencies now allow this test to run successfully.)