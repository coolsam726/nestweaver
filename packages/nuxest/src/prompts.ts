import { confirm, input, select } from '@inquirer/prompts';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DATABASE_LABELS,
  databasesForOrm,
  ORM_LABELS,
} from './database.js';
import type {
  Database,
  HttpAdapter,
  NuxtMode,
  Orm,
  ScaffoldOptions,
} from './types.js';

function isValidProjectName(name: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(name);
}

export async function collectOptions(
  projectNameArg?: string,
  targetDirArg?: string,
): Promise<ScaffoldOptions> {
  const projectName = projectNameArg
    ? projectNameArg
    : await input({
        message: 'Project name (kebab-case):',
        default: 'my-app',
        validate: (value) =>
          isValidProjectName(value)
            ? true
            : 'Use lowercase letters, numbers, and hyphens (start with a letter).',
      });

  if (!isValidProjectName(projectName)) {
    throw new Error(`Invalid project name: ${projectName}`);
  }

  const targetDir = targetDirArg ?? resolve(process.cwd(), projectName);

  assertTargetDirAvailable(targetDir, Boolean(targetDirArg));

  const orm = await select<Orm>({
    message: 'ORM',
    choices: (Object.keys(ORM_LABELS) as Orm[]).map((value) => ({
      value,
      name: ORM_LABELS[value],
    })),
  });

  let database: Database | null = null;
  if (orm !== 'none') {
    const allowed = databasesForOrm(orm);
    database = await select<Database>({
      message: 'Database',
      choices: allowed.map((value) => ({
        value,
        name: DATABASE_LABELS[value],
      })),
      default: allowed.includes('postgresql') ? 'postgresql' : allowed[0],
    });
  }

  const scheduling = await confirm({
    message: 'Enable task scheduling (@nestjs/schedule)?',
    default: true,
  });

  const queues = await confirm({
    message: 'Enable job queues (BullMQ + Redis)?',
    default: true,
  });

  const httpAdapter = await select<HttpAdapter>({
    message: 'HTTP adapter for NestJS',
    choices: [
      { value: 'fastify', name: 'Fastify (recommended)' },
      { value: 'express', name: 'Express' },
    ],
    default: 'fastify',
  });

  const admin = await confirm({
    message: 'Add MVC admin panel (Handlebars views at /admin)?',
    default: false,
  });

  if (admin && httpAdapter === 'fastify') {
    console.log('  Admin panel uses Handlebars via @fastify/view.');
  }

  const nuxtMode = await select<NuxtMode>({
    message: 'Nuxt rendering mode',
    choices: [
      { value: 'ssr', name: 'SSR (server-side rendering)' },
      { value: 'spa', name: 'SPA (client-only, static export style)' },
    ],
    default: 'ssr',
  });

  console.log('');
  console.log(`Scaffolding ${projectName} → ${targetDir}`);
  console.log(
    [
      `  ORM: ${ORM_LABELS[orm]}`,
      database ? `  Database: ${DATABASE_LABELS[database]}` : null,
      `  Scheduling: ${scheduling ? 'yes' : 'no'}`,
      `  Queues: ${queues ? 'yes' : 'no'}`,
      `  HTTP: ${httpAdapter}`,
      `  Admin: ${admin ? 'yes' : 'no'}`,
      `  Nuxt: ${nuxtMode.toUpperCase()}`,
    ]
      .filter(Boolean)
      .join('\n'),
  );
  console.log('');

  return {
    projectName,
    targetDir,
    orm,
    database,
    scheduling,
    queues,
    httpAdapter,
    admin,
    nuxtMode,
  };
}

function assertTargetDirAvailable(targetDir: string, isExplicitDir: boolean): void {
  const cwd = resolve(process.cwd());
  const resolved = resolve(targetDir);

  if (isExplicitDir && resolved === cwd) {
    const entries = readdirSync(resolved).filter(
      (entry) => entry !== '.git' && entry !== '.gitignore',
    );
    if (entries.length > 0) {
      throw new Error(
        `Current directory is not empty. Scaffold into an empty folder or choose a new name.`,
      );
    }
    return;
  }

  if (existsSync(resolved)) {
    throw new Error(`Directory already exists: ${resolved}`);
  }
}
