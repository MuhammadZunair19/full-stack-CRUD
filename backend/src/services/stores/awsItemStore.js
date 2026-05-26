import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

export class AwsItemStore {
  constructor(config) {
    this.config = config;
    this.dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.awsRegion }));
    this.s3 = new S3Client({ region: config.awsRegion });
  }

  async listItems() {
    const result = await this.dynamo.send(new ScanCommand({ TableName: this.config.dynamoTable }));
    const items = await Promise.all((result.Items || []).map((item) => this.withSignedUrl(item)));
    return items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async getItem(id) {
    const result = await this.dynamo.send(new GetCommand({
      TableName: this.config.dynamoTable,
      Key: { id }
    }));
    return result.Item ? this.withSignedUrl(result.Item) : null;
  }

  async createItem({ name, description, file }) {
    const now = new Date().toISOString();
    const item = {
      id: uuid(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      attachment: file ? await this.uploadFile(file) : null
    };

    await this.dynamo.send(new PutCommand({
      TableName: this.config.dynamoTable,
      Item: item
    }));

    return this.withSignedUrl(item);
  }

  async updateItem(id, { name, description, file, removeFile }) {
    const current = await this.getRawItem(id);
    if (!current) return null;

    let attachment = current.attachment || null;
    if ((file || removeFile) && attachment?.storageKey) {
      await this.deleteFile(attachment.storageKey);
      attachment = null;
    }

    if (file) {
      attachment = await this.uploadFile(file);
    }

    const item = {
      ...current,
      name,
      description,
      attachment,
      updatedAt: new Date().toISOString()
    };

    await this.dynamo.send(new PutCommand({
      TableName: this.config.dynamoTable,
      Item: item
    }));

    return this.withSignedUrl(item);
  }

  async deleteItem(id) {
    const current = await this.getRawItem(id);
    if (!current) return false;

    if (current.attachment?.storageKey) {
      await this.deleteFile(current.attachment.storageKey);
    }

    await this.dynamo.send(new DeleteCommand({
      TableName: this.config.dynamoTable,
      Key: { id }
    }));
    return true;
  }

  async getRawItem(id) {
    const result = await this.dynamo.send(new GetCommand({
      TableName: this.config.dynamoTable,
      Key: { id }
    }));
    return result.Item || null;
  }

  async uploadFile(file) {
    const storageKey = `${uuid()}-${sanitizeFilename(file.originalname)}`;
    await this.s3.send(new PutObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: storageKey,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    return {
      storageKey,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    };
  }

  async deleteFile(storageKey) {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: storageKey
    }));
  }

  async withSignedUrl(item) {
    if (!item.attachment?.storageKey) return item;

    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: item.attachment.storageKey
      }),
      { expiresIn: this.config.signedUrlExpiresSeconds }
    );

    return {
      ...item,
      attachment: {
        ...item.attachment,
        url
      }
    };
  }
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}
