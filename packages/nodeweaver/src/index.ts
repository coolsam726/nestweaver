import { collectOptions } from './prompts.js';
import { scaffoldProject } from './scaffold.js';
import { printBanner, printHelp } from './ui.js';
import { parseCreateArgs } from './parse-args.js';

export { collectOptions } from './prompts.js';
export { scaffoldProject } from './scaffold.js';
export type { ScaffoldOptions } from './types.js';

export async function runCreate(argv: string[]): Promise<void> {
  const parsed = parseCreateArgs(argv);

  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.version) {
    console.log(parsed.version);
    return;
  }

  printBanner();

  const options = await collectOptions(parsed.projectName, parsed.targetDir);
  await scaffoldProject(options);
}

export async function main(): Promise<void> {
  await runCreate(process.argv.slice(2));
}
