import { Injectable } from '@nestjs/common';
import { readFile, writeFile, unlink } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { ConfigService } from '@nestjs/config';
import { SHA256 } from 'crypto-js';

@Injectable()
export class FileService {
    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('host');
        const port = this.configService.get<string>('port');

        const basePath = SHA256(`${host}:${port}`);
        this.basePath = process.cwd() + `/storage/${basePath}/`;
    }

    public readonly basePath;

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

    async delete(path: string) {
        return unlink(path);
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
