```tsx
import React, { useState, useEffect } from 'react';
import DeploymentLogConsole from './components/DeploymentLogConsole';

function App() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [logs, setLogs] = useState([]);
  const [deploymentStatus, setDeploymentStatus] = useState('IDLE');

  useEffect(() => {
    // Simulate deployment process
    const interval = setInterval(() => {
      if (isBuilding) {
        setLogs((prevLogs) => [...prevLogs, `Building... ${new Date().toISOString()}`]);
        if (prevLogs.length >= 10) {
          setIsBuilding(false);
          setDeploymentStatus('DEPLOYED');
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isBuilding]);

  const handleDeploymentStart = () => {
    setIsBuilding(true);
    setLogs([]);
    setDeploymentStatus('BUILDING');
  };

  return (
    <div>
      <DeploymentLogConsole
        logs={logs}
        isBuilding={isBuilding}
        deploymentStatus={deploymentStatus}
        onClear={() => setLogs([])}
      />
      <button onClick={handleDeploymentStart}>Start Deployment</button>
    </div>
  );
}

export default App;
```