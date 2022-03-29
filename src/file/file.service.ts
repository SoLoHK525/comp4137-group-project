import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

@Injectable()
export class FileService {
  private readonly basePath = process.cwd() + '/storage/';

  save(path: string, content: Buffer | string) {
    this.createDirectoryToFile(this.basePath + path);
    return writeFile(this.basePath + path, content);
  }

  load(path: string): Promise<Buffer> | Promise<string> | Promise<string | Buffer> {
    return readFile(this.basePath + path);
  }

  exists(path: string): boolean {
    return existsSync(this.basePath + path);
  }

  createDirectoryToFile(file: string) {
    const dir = dirname(file);

    if (existsSync(dir)) {
      return true;
    }

    this.createDirectoryToFile(dir);
    mkdirSync(dir);
  }
}
