import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { Client, ScpClient } from 'node-scp';
import { Metadata } from '@geysermc/actions-release';
import os from 'os';

async function run(): Promise<void> {
    let client: ScpClient | null = null;
    try {
        const metadataFile = core.getInput('metadata');
        if (!fs.existsSync(metadataFile)) {
            console.log(`Metadata file ${metadataFile} does not exist`);
            core.setFailed(`Metadata file ${metadataFile} does not exist`);
        }

        let directory = core.getInput('directory');

        if (directory === 'auto') {
            directory = `uploads/${process.env.GITHUB_REPOSITORY}/${process.env.GITHUB_RUN_ID}/`
        }

        const files = core.getInput('files');
        let uploads: string[] = files.includes('\n') ? files.split('\n') : files.split(',');
        uploads = uploads
            .map(s => s.trim()).filter(s => s !== '')
            .map(s => s.includes(':') ? s.split(':').slice(1).join(':') : s);

        client = await Client({
            host: core.getInput('host'),
            port: core.getInput('port'),
            username: core.getInput('username'),
            privateKey: Buffer.from(core.getInput('privateKey'), 'utf-8')
        });

        console.log(`Creating release directory ${directory}`);
        const parts = directory.split('/');
        let current = '';
        for (const part of parts) {
            current += part + '/';
            if (!(await client.exists(current))) {
                await client.mkdir(current);
            }
        }
        console.log(`Created directory ${directory}`);

        for (const file of uploads) {
            console.log(`Uploading ${file}`);
            await client.uploadFile(file, path.join(directory, path.basename(file)));
            console.log(`Uploaded ${file}`);
        }

        console.log(`Uploading metadata`);
        await client.uploadFile(metadataFile, path.join(directory, path.basename(metadataFile)));
        console.log(`Uploaded metadata`);
        client.close();

        console.log(`Release uploaded`);

        const metadata: Metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        const downloadsApiUrl = core.getInput('downloadsApiUrl');
        const changelog = core.getInput('changelog');

        core.summary
            .addRaw('## Release Information', true)
            .addRaw('### Metadata', true)
            .addDetails('Expand Metadata', `${os.EOL}${os.EOL}\`\`\`json${os.EOL}${JSON.stringify(metadata, null, 4)}${os.EOL}\`\`\`${os.EOL}${os.EOL}`)
            .addRaw(os.EOL);
        
        if (changelog !== '') {
            core.summary
                .addRaw(changelog, true)
                .addRaw(os.EOL);
        }

        core.summary.addRaw(`### Downloads (Build #${metadata.number})`, true);

        for (const label in metadata.downloads) {
            const url = new URL(`${metadata.project}/versions/${metadata.version}/builds/${metadata.number}/downloads/${label}`, downloadsApiUrl).href;
            core.summary.addRaw(`- [${metadata.downloads[label].name}](${url})`, true);
        }

        core.summary.addRaw(os.EOL).write();
        
    } catch (error: any) {
        if (client) client.close();
        console.log(error.message);
        core.setFailed(error.message);
    }
}

run();