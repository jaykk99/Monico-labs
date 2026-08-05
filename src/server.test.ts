import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import { Server } from 'http';

// This is a mock server. In a real scenario, you would import and test your actual 'server.ts'
// For this example, we'll create a minimal Express app to demonstrate testing concepts.
const app: Express = express();
let server: Server;

app.use(express.json()); // Enable JSON body parsing

// Middleware to simulate authentication or other pre-processing
app.use('/mcp-api/secure', (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['authorization'] !== 'Bearer valid_token') {
    return res.status(401).send('Unauthorized');
  }
  next();
});

// Example MCP endpoint
app.post('/mcp-api/process', (req: Request, res: Response) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'Data is required' });
  }

  if (typeof data !== 'string') {
    return res.status(400).json({ error: 'Data must be a string' });
  }

  if (data === 'error_trigger') {
    return res.status(500).json({ error: 'Internal server error triggered by specific input' });
  }

  // Simulate some processing
  res.status(200).json({ message: `Processed: ${data}` });
});

// Example MCP endpoint with a delay to simulate long-running tasks for concurrency tests
app.post('/mcp-api/long-process', async (req: Request, res: Response) => {
  const { delayMs } = req.body;
  const actualDelay = delayMs && typeof delayMs === 'number' ? delayMs : 100;

  if (actualDelay > 1000) { // Limit max delay to prevent tests from running too long
    return res.status(400).json({ error: 'Delay cannot exceed 1000ms' });
  }

  await new Promise(resolve => setTimeout(resolve, actualDelay));
  res.status(200).json({ message: `Long process completed after ${actualDelay}ms` });
});

// A simple health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

beforeAll(() => {
  server = app.listen(3001, () => {
    console.log('Test server running on port 3001');
  });
});

afterAll((done) => {
  server.close((err) => {
    if (err) {
      console.error('Error closing test server:', err);
      done(err);
    } else {
      console.log('Test server closed');
      done();
    }
  });
});

describe('MCP Server API Tests', () => {
  it('should return 200 for a successful health check', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  describe('POST /mcp-api/process', () => {
    it('should successfully process valid data', async () => {
      const res = await request(app)
        .post('/mcp-api/process')
        .send({ data: 'hello world' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: 'Processed: hello world' });
    });

    it('should return 400 if data is missing', async () => {
      const res = await request(app)
        .post('/mcp-api/process')
        .send({}); // Missing 'data' field
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Data is required' });
    });

    it('should return 400 if data is not a string', async () => {
      const res = await request(app)
        .post('/mcp-api/process')
        .send({ data: 123 }); // Data is a number
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Data must be a string' });
    });

    it('should return 500 for a specific error-triggering input', async () => {
      const res = await request(app)
        .post('/mcp-api/process')
        .send({ data: 'error_trigger' });
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({ error: 'Internal server error triggered by specific input' });
    });

    it('should handle empty string data correctly', async () => {
      const res = await request(app)
        .post('/mcp-api/process')
        .send({ data: '' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: 'Processed: ' });
    });

    it('should handle long string data correctly (edge case for buffer/size limits)', async () => {
      const longString = 'a'.repeat(2000); // Create a long string
      const res = await request(app)
        .post('/mcp-api/process')
        .send({ data: longString });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: `Processed: ${longString}` });
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple requests concurrently without data corruption', async () => {
      const requests = [];
      const numRequests = 5;
      const expectedMessages: string[] = [];

      for (let i = 0; i < numRequests; i++) {
        const data = `concurrent_data_${i}`;
        expectedMessages.push(`Processed: ${data}`);
        requests.push(
          request(app)
            .post('/mcp-api/process')
            .send({ data })
        );
      }

      const responses = await Promise.all(requests);

      expect(responses.length).toEqual(numRequests);
      responses.forEach((res, index) => {
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual(expectedMessages[index]);
      });
    });

    it('should not block on long-running concurrent requests', async () => {
      const startTime = Date.now();
      const numRequests = 3;
      const individualDelay = 50; // ms

      const requests = [];
      for (let i = 0; i < numRequests; i++) {
        requests.push(
          request(app)
            .post('/mcp-api/long-process')
            .send({ delayMs: individualDelay })
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // The total time should be closer to individualDelay than (numRequests * individualDelay)
      // This indicates that requests were processed concurrently, not sequentially.
      const totalTime = endTime - startTime;
      console.log(`Concurrent long-process requests took ${totalTime}ms`);

      expect(responses.length).toEqual(numRequests);
      responses.forEach(res => {
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).includes(`Long process completed after ${individualDelay}ms`);
      });
      // Allow for some overhead, but ensure it's not strictly sequential
      expect(totalTime).toBeLessThan(numRequests * individualDelay * 2); // Less than double the sequential time
      expect(totalTime).toBeGreaterThanOrEqual(individualDelay); // At least the individual delay
    });
  });

  describe('Security/Auth Edge Cases', () => {
    it('should return 401 for unauthorized access to a secure endpoint', async () => {
      const res = await request(app)
        .post('/mcp-api/secure')
        .send({ some: 'data' }); // No authorization header
      expect(res.statusCode).toEqual(401);
      expect(res.text).toEqual('Unauthorized');
    });

    it('should return 401 for invalid token to a secure endpoint', async () => {
      const res = await request(app)
        .post('/mcp-api/secure')
        .set('Authorization', 'Bearer invalid_token')
        .send({ some: 'data' });
      expect(res.statusCode).toEqual(401);
      expect(res.text).toEqual('Unauthorized');
    });

    it('should allow access with a valid token to a secure endpoint', async () => {
      // For this example, we'll make a mock secure endpoint that just returns success if authorized
      app.post('/mcp-api/secure', (req: Request, res: Response) => {
        res.status(200).json({ message: 'Secure access granted' });
      });

      const res = await request(app)
        .post('/mcp-api/secure')
        .set('Authorization', 'Bearer valid_token')
        .send({ some: 'data' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: 'Secure access granted' });
    });
  });
});