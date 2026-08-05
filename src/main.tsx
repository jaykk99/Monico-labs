import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './ErrorBoundary.tsx';
import './index.css';

// Mock API for fetching deployments
// In a real application, this would interact with Firebase or a backend API.
export const fetchDeployments = async (projectId: string): Promise<Deployment[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockDeployments: Deployment[] = [
        {
          id: "dep-001",
          projectId: projectId,
          timestamp: "2026-07-30T10:00:00Z",
          status: "SUCCESS",
          logs: [
            "[vortex] Starting deployment for project 'my-awesome-project'",
            "[compiler] Compiling source files...",
            "[vite] Bundling complete.",
            "[vortex-cdn] Uploading assets to CDN.",
            "🎉 Deployment successful!",
          ],
        },
        {
          id: "dep-002",
          projectId: projectId,
          timestamp: "2026-07-30T11:30:00Z",
          status: "FAILED",
          logs: [
            "[vortex] Starting deployment for project 'my-awesome-project'",
            "[compiler] Compiling source files...",
            "ERROR: Missing dependency 'lodash'.",
            "Deployment failed.",
            "Please check your package.json dependencies.",
          ],
        },
        {
          id: "dep-003",
          projectId: projectId,
          timestamp: "2026-08-01T14:15:00Z",
          status: "SUCCESS",
          logs: [
            "[vortex] Starting deployment for project 'my-awesome-project'",
            "[compiler] Compiling source files...",
            "[next] Optimizing images...",
            "[vortex-cdn] Cache invalidated.",
            "🎉 All systems go! Deployment completed.",
          ],
        },
        {
          id: "dep-004",
          projectId: projectId,
          timestamp: "2026-08-05T10:00:00Z",
          status: "BUILDING",
          logs: [
            "[vortex] Starting deployment for project 'my-awesome-project'",
            "[compiler] Compiling source files...",
            "[vite] Analyzing module graph...",
            "[vite] Building production bundle...",
            "Bundling chunks and mapping routing table boundaries...", // This will be streamed
          ],
        },
      ];
      resolve(mockDeployments);
    }, 500);
  });
};


window.addEventListener('error', (e) => {
  if (e.message === 'Script error.') {
    e.preventDefault();
    e.stopPropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);