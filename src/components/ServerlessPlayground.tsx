import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { fetchServerlessFunctions, deployFunction, runFunction } from '../api/serverless';
import { ServerlessFunction } from '../types/ServerlessFunction';
import { Editor } from '@monaco-editor/react';

const ServerlessPlayground: React.FC = () => {
  const [functions, setFunctions] = useState<ServerlessFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<ServerlessFunction | null>(null);
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newFunctionName, setNewFunctionName] = useState<string>('');
  const [newFunctionCode, setNewFunctionCode] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>('');
  const [functionVersion, setFunctionVersion] = useState<string>('latest'); // New state for versioning

  useEffect(() => {
    loadFunctions();
  }, []);

  const loadFunctions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchServerlessFunctions();
      if (error) throw error;
      setFunctions(data || []);
    } catch (error: any) {
      console.error('Error loading functions:', error.message);
      setOutput(`Error loading functions: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFunction = (func: ServerlessFunction) => {
    setSelectedFunction(func);
    setCode(func.code);
    setFunctionVersion(func.version || 'latest'); // Set version when selecting
    setOutput('');
  };

  const handleDeployFunction = async () => {
    if (!selectedFunction) {
      setOutput('No function selected for deployment.');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await deployFunction(selectedFunction.id, code);
      if (error) throw error;
      setOutput(`Function '${selectedFunction.name}' deployed successfully! Deployment ID: ${data?.deploymentId}`);
      await loadFunctions(); // Refresh the list to show new deployment status/version
    } catch (error: any) {
      console.error('Error deploying function:', error.message);
      setOutput(`Error deploying function: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunFunction = async () => {
    if (!selectedFunction) {
      setOutput('No function selected to run.');
      return;
    }
    setIsLoading(true);
    try {
      let parsedBody = {};
      if (requestBody) {
        try {
          parsedBody = JSON.parse(requestBody);
        } catch (e: any) {
          setOutput(`Error parsing request body JSON: ${e.message}`);
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await runFunction(selectedFunction.id, parsedBody, functionVersion);
      if (error) throw error;
      setOutput(`Function Output: \n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      console.error('Error running function:', error.message);
      setOutput(`Error running function: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFunction = async () => {
    if (!newFunctionName || !newFunctionCode) {
      setOutput('Function name and code are required.');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('serverless_functions')
        .insert([{ name: newFunctionName, code: newFunctionCode, version: '1.0.0' }]); // Initial version
      if (error) throw error;
      setOutput(`Function '${newFunctionName}' created successfully!`);
      setNewFunctionName('');
      setNewFunctionCode('');
      await loadFunctions();
    } catch (error: any) {
      console.error('Error creating function:', error.message);
      setOutput(`Error creating function: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Serverless Function Playground</h1>

      <div className="flex space-x-4">
        <div className="w-1/3">
          <h2 className="text-xl font-semibold mb-2">Your Functions</h2>
          {isLoading && <p>Loading functions...</p>}
          <ul className="border rounded p-2 max-h-96 overflow-y-auto">
            {functions.map((func) => (
              <li
                key={func.id}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  selectedFunction?.id === func.id ? 'bg-blue-200' : ''
                }`}
                onClick={() => handleSelectFunction(func)}
              >
                {func.name} (v{func.version || 'latest'})
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Create New Function</h2>
            <input
              type="text"
              placeholder="Function Name"
              className="border p-2 w-full mb-2"
              value={newFunctionName}
              onChange={(e) => setNewFunctionName(e.target.value)}
            />
            <Editor
              height="200px"
              language="typescript"
              theme="vs-dark"
              value={newFunctionCode}
              onChange={(value) => setNewFunctionCode(value || '')}
              options={{ minimap: { enabled: false } }}
            />
            <button
              onClick={handleCreateFunction}
              className="bg-green-500 text-white p-2 rounded mt-2 hover:bg-green-600"
              disabled={isLoading}
            >
              Create Function
            </button>
          </div>
        </div>

        <div className="w-2/3 space-y-4">
          {selectedFunction && (
            <>
              <h2 className="text-xl font-semibold">
                Selected Function: {selectedFunction.name} (v{selectedFunction.version || 'latest'})
              </h2>
              <div>
                <label htmlFor="functionVersion" className="block text-sm font-medium text-gray-700">
                  Function Version:
                </label>
                <select
                  id="functionVersion"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={functionVersion}
                  onChange={(e) => setFunctionVersion(e.target.value)}
                >
                  {/* In a real scenario, you'd fetch available versions for the selected function */}
                  <option value="latest">latest</option>
                  {/* Example static versions - replace with dynamic data */}
                  {selectedFunction.version && selectedFunction.version !== 'latest' && (
                    <option value={selectedFunction.version}>{selectedFunction.version}</option>
                  )}
                  {/* Add more dynamic versions here based on actual deployments */}
                </select>
              </div>
              <Editor
                height="400px"
                language="typescript"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{ minimap: { enabled: false } }}
              />
              <textarea
                placeholder="Enter JSON request body here..."
                className="border p-2 w-full h-32"
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
              />
              <div className="space-x-2">
                <button
                  onClick={handleRunFunction}
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                  disabled={isLoading}
                >
                  Run Function
                </button>
                <button
                  onClick={handleDeployFunction}
                  className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
                  disabled={isLoading}
                >
                  Deploy Function
                </button>
              </div>

              <div className="mt-4">
                <h2 className="text-xl font-semibold">Output</h2>
                <pre className="bg-gray-800 text-white p-4 rounded overflow-auto max-h-80">
                  {isLoading ? 'Running/Deploying...' : output}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerlessPlayground;