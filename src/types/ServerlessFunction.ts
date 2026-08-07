export interface ServerlessFunction {
  id: string;
  name: string;
  code: string;
  created_at: string;
  version?: string; // Add version to the interface
}