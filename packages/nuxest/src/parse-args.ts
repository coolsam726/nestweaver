import { readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ParsedCreateArgs {
  projectName?: string;
  targetDir?: string;
  help: boolean;
  version: string | null;
}

export function parseCreateArgs(argv: string[]): ParsedCreateArgs {
  if (argv.includes('--help') || argv.includes('-h')) {
    return { help: true, version: null };
  }

  if (argv.includes('--version') || argv.includes('-v')) {
    return { help: false, version: readPackageVersion() };
  }

  const positional = argv.filter((arg) => !arg.startsWith('-'));

  if (positional.length === 0) {
    return { help: false, version: null };
  }

  const raw = positional[0];

  if (raw === '.') {
    const targetDir = resolve(process.cwd());
    return {
      projectName: basename(targetDir),
      targetDir,
      help: false,
      version: null,
    };
  }

  return {
    projectName: raw,
    targetDir: resolve(process.cwd(), raw),
    help: false,
    version: null,
  };
}

function readPackageVersion(): string {
  try {
    const pkgPath = join(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      'package.json',
    );
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}
