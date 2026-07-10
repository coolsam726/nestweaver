const PREFIXES = [
  'Atlas',
  'Beacon',
  'Cedar',
  'Delta',
  'Echo',
  'Frontier',
  'Granite',
  'Harbor',
  'Ironwood',
  'Juniper',
  'Keystone',
  'Lumen',
  'Meridian',
  'Nova',
  'Orion',
  'Pioneer',
  'Quartz',
  'Riverstone',
  'Summit',
  'Titan',
  'Union',
  'Vertex',
  'Westwind',
  'Zenith',
  'Apex',
  'Bright',
  'Cobalt',
  'Drift',
  'Evergreen',
  'Forge',
  'Helix',
  'Ion',
  'Jade',
  'Kite',
  'Lattice',
];

const SUFFIXES = [
  'Dynamics',
  'Holdings',
  'Industries',
  'Group',
  'Labs',
  'Systems',
  'Partners',
  'Works',
  'Collective',
  'Ventures',
  'Solutions',
  'Services',
  'Corp',
  'Co',
  'International',
];

export interface DemoCompanySeed {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  active: boolean;
}

export function buildDemoCompanies(count: number): DemoCompanySeed[] {
  const companies: DemoCompanySeed[] = [];

  for (let index = 0; index < count; index++) {
    const prefix = PREFIXES[index % PREFIXES.length]!;
    const suffix = SUFFIXES[Math.floor(index / PREFIXES.length) % SUFFIXES.length]!;
    const serial = String(index + 1).padStart(2, '0');
    const slug = `${prefix}-${suffix}-${serial}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    companies.push({
      name: `${prefix} ${suffix} ${serial}`,
      code: `CO${String(index + 1).padStart(3, '0')}`,
      email: `hello@${slug}.example.com`,
      phone: `+1-555-${String(1000 + index).padStart(4, '0')}`,
      active: index % 6 !== 0,
    });
  }

  return companies;
}
