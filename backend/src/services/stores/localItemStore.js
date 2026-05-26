import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuid } from 'uuid';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../');
const dataDir = path.join(root, 'data');
const uploadDir = path.join(root, 'uploads');
const dataFile = path.join(dataDir, 'items.json');

export class LocalItemStore {
  async listItems() {
    const items = await readItems();
    return items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async getItem(id) {
    const items = await readItems();
    return items.find((item) => item.id === id) || null;
  }

  async createItem({ name, description, file }) {
    const now = new Date().toISOString();
    const item = {
      id: uuid(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      attachment: file ? await saveLocalFile(file) : null
    };

    const items = await readItems();
    items.push(item);
    await writeItems(items);
    return item;
  }

  async updateItem(id, { name, description, file, removeFile }) {
    const items = await readItems();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const current = items[index];
    let attachment = current.attachment;

    if ((file || removeFile) && attachment?.storageKey) {
      await rm(path.join(uploadDir, attachment.storageKey), { force: true });
      attachment = null;
    }

    if (file) {
      attachment = await saveLocalFile(file);
    }

    items[index] = {
      ...current,
      name,
      description,
      attachment,
      updatedAt: new Date().toISOString()
    };

    await writeItems(items);
    return items[index];
  }

  async deleteItem(id) {
    const items = await readItems();
    const item = items.find((candidate) => candidate.id === id);
    if (!item) return false;

    if (item.attachment?.storageKey) {
      await rm(path.join(uploadDir, item.attachment.storageKey), { force: true });
    }

    await writeItems(items.filter((candidate) => candidate.id !== id));
    return true;
  }
}

async function saveLocalFile(file) {
  await mkdir(uploadDir, { recursive: true });
  const storageKey = `${uuid()}-${sanitizeFilename(file.originalname)}`;
  await writeFile(path.join(uploadDir, storageKey), file.buffer);

  return {
    storageKey,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
  };
}

async function readItems() {
  await mkdir(dataDir, { recursive: true });
  try {
    return JSON.parse(await readFile(dataFile, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeItems(items) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(items, null, 2));
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}
