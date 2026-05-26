import { config } from '../config.js';
import { AwsItemStore } from './stores/awsItemStore.js';
import { LocalItemStore } from './stores/localItemStore.js';

export function createItemService() {
  const store = config.storageDriver === 'aws' ? new AwsItemStore(config) : new LocalItemStore();

  return {
    list: () => store.listItems(),
    get: (id) => store.getItem(id),
    create: ({ name, description, file }) => {
      validateItemInput({ name, description });
      return store.createItem({ name: name.trim(), description: description?.trim() || '', file });
    },
    update: (id, { name, description, file, removeFile }) => {
      validateItemInput({ name, description });
      return store.updateItem(id, {
        name: name.trim(),
        description: description?.trim() || '',
        file,
        removeFile
      });
    },
    remove: (id) => store.deleteItem(id),
    getFile: (storageKey) => {
      if (!store.getFile) {
        const error = new Error('File download endpoint is only available for local storage');
        error.statusCode = 404;
        throw error;
      }
      return store.getFile(storageKey);
    }
  };
}

function validateItemInput({ name }) {
  if (!name || !name.trim()) {
    const error = new Error('Name is required');
    error.statusCode = 400;
    throw error;
  }
}
