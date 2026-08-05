```typescript
// ...

const handleRunFunction = async () => {
  if (!selectedFunc) return;

  setIsLoading(true);
  setExecResult(null);

  try {
    let parsedBody = JSON.parse(requestBodyText);
    // ...
  } catch (e) {
    console.error("Failed to parse request body:", e);
    // Handle parsing error
  }

  // ...
};

// ...
```
Note: The `FIREBASE_API_KEY` should be replaced with an environment variable or a secure way to store the API key. The `handleRunFunction` has been updated to handle JSON parsing errors.