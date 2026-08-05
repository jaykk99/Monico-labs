```tsx
import { useEffect, useState } from 'react';
import './BlueprintEditor.css';

interface Field {
  name: string;
  type: string;
}

interface Collection {
  name: string;
  description: string;
  fields: Field[];
}

interface Blueprint {
  collections: Collection[];
}

interface AppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId: string;
}

export default function BlueprintEditor() {
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [appletConfig, setAppletConfig] = useState<AppletConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load JSON files from public root
  useEffect(() => {
    async function load() {
      try {
        const [bpRes, acRes] = await Promise.all([
          fetch('/firebase-blueprint.json'),
          fetch('/firebase-applet-config.json'),
        ]);

        if (!bpRes.ok || !acRes.ok) {
          throw new Error('Failed to fetch configuration files');
        }

        const bpJson = await bpRes.json();
        const acJson = await acRes.json();

        setBlueprint(bpJson);
        setAppletConfig(acJson);
      } catch (e: any) {
        setError(e.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Handlers for blueprint editing
  const updateCollection = (idx: number, updated: Partial<Collection>) => {
    setBlueprint((prev) => {
      if (!prev) return prev;
      const newCollections = [...prev.collections];
      newCollections[idx] = { ...newCollections[idx], ...updated };
      return { ...prev, collections: newCollections };
    });
  };

  const addCollection = () => {
    setBlueprint((prev) => {
      if (!prev) return prev;
      const newCollections = [
        ...prev.collections,
        { name: 'new_collection', description: '', fields: [] },
      ];
      return { ...prev, collections: newCollections };
    });
  };

  const removeCollection = (idx: number) => {
    setBlueprint((prev) => {
      if (!prev) return prev;
      const newCollections = prev.collections.filter((_, i) => i !== idx);
      return { ...prev, collections: newCollections };
    });
  };

  const addField = (colIdx: number) => {
    setBlueprint((prev) => {
      if (!prev) return prev;
      const newCollections = [...prev.collections];
      const col = newCollections[colIdx];
      col.fields = [...col.fields, { name: 'new_field', type: 'string' }];
      return { ...prev, collections: newCollections };
    });
  };

  const removeField = (colIdx: number, fieldIdx: number) => {
    setBlueprint((prev) => {
      if (!prev) return prev;
      const newCollections = [...prev.collections];
      const col = newCollections[colIdx];
      col.fields = col.fields.filter((_, i) => i !== fieldIdx);
      return { ...prev, collections: newCollections };
    });
  };

  const updateField = (
    colIdx: number,
    fieldIdx: number,
    updated: Partial<Field>
  ) => {
    setBlueprint((prev) => {
      if (!prev) return prev;
      const newCollections = [...prev.collections];
      const col = newCollections[colIdx];
      const newFields = [...col.fields];
      newFields[fieldIdx] = { ...newFields[fieldIdx], ...updated };
      col.fields = newFields;
      return { ...prev, collections: newCollections };
    });
  };

  // Handlers for applet config editing
  const updateAppletConfig = (updated: Partial<AppletConfig>) => {
    setAppletConfig((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  const handleSave = () => {
    console.log('Blueprint JSON:', JSON.stringify(blueprint, null, 2));
    console.log('Applet Config JSON:', JSON.stringify(appletConfig, null, 2));
    alert('Configuration logged to console. Implement persistence as needed.');
  };

  if (loading) return <div className="editor">Loading configuration...</div>;
  if (error) return <div className="editor error">Error: {error}</div>;

  return (
    <div className="editor">
      <h1>Interactive Blueprint Editor</h1>

      <section className="section">
        <h2>Blueprint Collections</h2>
        {blueprint?.collections.map((col, colIdx) => (
          <div key={colIdx} className="collection">
            <div className="collection-header">
              <input
                type="text"
                value={col.name}
                onChange={(e) => updateCollection(colIdx, { name: e.target.value })}
                placeholder="Collection name"
              />
              <button onClick={() => removeCollection(colIdx)}>Delete</button>
            </div>
            <textarea
              value={col.description}
              onChange={(e) =>
                updateCollection(colIdx, { description: e.target.value })
              }
              placeholder="Description"
            />
            <h3>Fields</h3>
            {col.fields.map((field, fieldIdx) => (
              <div key={fieldIdx} className="field">
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) =>
                    updateField(colIdx, fieldIdx, { name: e.target.value })
                  }
                  placeholder="Field name"
                />
                <select
                  value={field.type}
                  onChange={(e) =>
                    updateField(colIdx, fieldIdx, { type: e.target.value })
                  }
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="timestamp">timestamp</option>
                  <option value="array">array</option>
                  <option value="map">map</option>
                </select>
                <button onClick={() => removeField(colIdx, fieldIdx)}>✕</button>
              </div>
            ))}
            <button onClick={() => addField(colIdx)}>Add Field</button>
          </div>
        ))}
        <button onClick={addCollection}>Add Collection</button>
      </section>

      <section className="section">
        <h2>Applet Configuration</h2>
        {appletConfig && (
          <div className="applet-config">
            {Object.entries(appletConfig).map(([key, value]) => (
              <div key={key} className="config-field">
                <label>{key}</label>
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) =>
                    updateAppletConfig({ [key]: e.target.value } as Partial<AppletConfig>)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <button className="save-btn" onClick={handleSave}>
        Save (to console)
      </button>
    </div>
  );
}
```
