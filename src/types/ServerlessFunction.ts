```typescript
interface ServerlessFunction {
  id: string;
  name: string;
  code: string;
  route: string;
  description: string;
  version: string;
  createdAt: string;
}

interface FunctionExecutionLog {
  id: string;
  functionId: string;
  timestamp: string;
  durationMs: number;
  status: number;
 (memoryMb: number);
  stdout: string[];
  responseBody: string;
}
```
