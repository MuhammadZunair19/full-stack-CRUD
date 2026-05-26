import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { createItemService } from './services/itemService.js';

const app = express();
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
const frontendDist = path.join(rootDir, 'frontend/dist');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes }
});
const items = createItemService();

app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());
app.use(express.static(frontendDist));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    storage: config.storageDriver,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/items', async (_req, res, next) => {
  try {
    res.json(await items.list());
  } catch (error) {
    next(error);
  }
});

app.get('/api/items/:id', async (req, res, next) => {
  try {
    const item = await items.get(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.get('/api/files/:storageKey', async (req, res, next) => {
  try {
    const filePath = await items.getFile(req.params.storageKey);
    res.sendFile(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ message: 'File not found' });
      return;
    }
    next(error);
  }
});

app.post('/api/items', upload.single('file'), async (req, res, next) => {
  try {
    const item = await items.create({
      name: req.body.name,
      description: req.body.description,
      file: req.file
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

app.put('/api/items/:id', upload.single('file'), async (req, res, next) => {
  try {
    const item = await items.update(req.params.id, {
      name: req.body.name,
      description: req.body.description,
      file: req.file,
      removeFile: req.body.removeFile === 'true'
    });
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/items/:id', async (req, res, next) => {
  try {
    const deleted = await items.remove(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
    if (error) next();
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ message: 'Files must be 10MB or smaller' });
    return;
  }

  const status = error.statusCode || 500;
  res.status(status).json({
    message: error.message || 'Unexpected server error'
  });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
