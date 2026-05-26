import { useEffect, useMemo, useState } from 'react';
import { Download, Edit3, File, Image, Plus, RefreshCw, Search, Trash2, Upload, X } from 'lucide-react';
import { createItem, deleteItem, getItems, updateItem } from './api.js';

const blankForm = {
  name: '',
  description: '',
  file: null,
  removeFile: false
};

export default function App() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) =>
      `${item.name} ${item.description}`.toLowerCase().includes(value)
    );
  }, [items, query]);

  async function loadItems() {
    setLoading(true);
    setError('');
    try {
      setItems(await getItems());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || '',
      file: null,
      removeFile: false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditing(null);
    setForm(blankForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = editing
        ? await updateItem(editing.id, form)
        : await createItem(form);

      setItems((current) => {
        const next = editing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current];
        return next.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Delete "${item.name}"?`);
    if (!confirmed) return;

    setError('');
    try {
      await deleteItem(item.id);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      if (selected?.id === item.id) setSelected(null);
      if (editing?.id === item.id) resetForm();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">AWS CRUD project</p>
          <h1>Item manager</h1>
        </div>
        <button className="icon-button" onClick={loadItems} title="Refresh items" type="button">
          <RefreshCw size={20} />
        </button>
      </section>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <section className="workspace">
        <form className="editor" onSubmit={handleSubmit}>
          <div className="section-heading">
            <h2>{editing ? 'Edit item' : 'Create item'}</h2>
            {editing && (
              <button className="ghost-button" onClick={resetForm} type="button">
                <X size={18} />
                Cancel
              </button>
            )}
          </div>

          <label>
            Name
            <input
              maxLength={90}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Project report"
              required
              value={form.name}
            />
          </label>

          <label>
            Description
            <textarea
              maxLength={800}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Add a short description"
              rows={5}
              value={form.description}
            />
          </label>

          <label className="file-picker">
            <Upload size={20} />
            <span>{form.file ? form.file.name : 'Choose attachment'}</span>
            <input
              onChange={(event) => setForm({ ...form, file: event.target.files[0] || null })}
              type="file"
            />
          </label>

          {editing?.attachment && (
            <label className="checkbox-row">
              <input
                checked={form.removeFile}
                onChange={(event) => setForm({ ...form, removeFile: event.target.checked })}
                type="checkbox"
              />
              Remove current attachment
            </label>
          )}

          <button className="primary-button" disabled={saving} type="submit">
            <Plus size={18} />
            {saving ? 'Saving...' : editing ? 'Update item' : 'Create item'}
          </button>
        </form>

        <section className="list-panel">
          <div className="search-row">
            <Search size={18} />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search items"
              value={query}
            />
          </div>

          {loading ? (
            <div className="empty-state">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">No items found.</div>
          ) : (
            <div className="grid">
              {filteredItems.map((item) => (
                <article className="item-card" key={item.id}>
                  <button className="card-main" onClick={() => setSelected(item)} type="button">
                    <AttachmentPreview attachment={item.attachment} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{formatDate(item.updatedAt)}</small>
                    </span>
                    <p>{item.description || 'No description'}</p>
                  </button>
                  <div className="card-actions">
                    <button onClick={() => startEdit(item)} title="Edit item" type="button">
                      <Edit3 size={17} />
                    </button>
                    <button onClick={() => handleDelete(item)} title="Delete item" type="button">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading">
              <h2>{selected.name}</h2>
              <button className="icon-button" onClick={() => setSelected(null)} title="Close" type="button">
                <X size={20} />
              </button>
            </div>
            <p>{selected.description || 'No description'}</p>
            {selected.attachment && (
              <div className="attachment-detail">
                <AttachmentPreview attachment={selected.attachment} large />
                <div>
                  <strong>{selected.attachment.fileName}</strong>
                  <small>{formatBytes(selected.attachment.size)}</small>
                  <a href={selected.attachment.url} rel="noreferrer" target="_blank">
                    <Download size={17} />
                    Open attachment
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function AttachmentPreview({ attachment, large = false }) {
  if (!attachment) {
    return (
      <span className={`preview ${large ? 'large' : ''}`}>
        <File size={large ? 36 : 24} />
      </span>
    );
  }

  if (attachment.mimeType?.startsWith('image/')) {
    return (
      <span className={`preview image-preview ${large ? 'large' : ''}`}>
        <img alt="" src={attachment.url} />
      </span>
    );
  }

  return (
    <span className={`preview ${large ? 'large' : ''}`}>
      <Image size={large ? 36 : 24} />
    </span>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
