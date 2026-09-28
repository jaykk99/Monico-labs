import './BlueprintEditor.css';

/**
 * BlueprintEditor — visual serverless-function blueprint editor.
 *
 * NOTE: This is a minimal placeholder component. The full interactive editor
 * has not been implemented yet; it renders the dashboard panels that do exist.
 */
export default function BlueprintEditor() {
  return (
    <div className="blueprint-editor">
      <header className="blueprint-editor__header">
        <h1>Monico Labs</h1>
        <p>Serverless playground and monitoring — blueprint editor coming soon.</p>
      </header>
      <main className="blueprint-editor__body">
        <p>
          The visual blueprint editor is not implemented in this build. Use the
          MCP server endpoints or the dashboard components to manage projects.
        </p>
      </main>
    </div>
  );
}
