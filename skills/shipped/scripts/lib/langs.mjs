// File extension -> language, plus paths that shouldn't count as "code you wrote".
const MAP = {
  ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', cts: 'TypeScript',
  js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
  vue: 'Vue', svelte: 'Svelte', astro: 'Astro',
  py: 'Python', ipynb: 'Jupyter', rb: 'Ruby', php: 'PHP',
  go: 'Go', rs: 'Rust', java: 'Java', kt: 'Kotlin', kts: 'Kotlin', scala: 'Scala',
  cs: 'C#', fs: 'F#', vb: 'Visual Basic', razor: 'Razor', cshtml: 'Razor',
  c: 'C', h: 'C', cpp: 'C++', cc: 'C++', hpp: 'C++', m: 'Objective-C', mm: 'Objective-C',
  swift: 'Swift', dart: 'Dart', lua: 'Lua', ex: 'Elixir', exs: 'Elixir', erl: 'Erlang',
  hs: 'Haskell', clj: 'Clojure', zig: 'Zig', nim: 'Nim', r: 'R', jl: 'Julia',
  sh: 'Shell', bash: 'Shell', zsh: 'Shell', ps1: 'PowerShell', psm1: 'PowerShell',
  sql: 'SQL', graphql: 'GraphQL', gql: 'GraphQL', proto: 'Protobuf',
  html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS', sass: 'SCSS', less: 'Less',
  md: 'Markdown', mdx: 'MDX', tf: 'Terraform', hcl: 'Terraform', nix: 'Nix',
  yml: 'YAML', yaml: 'YAML', toml: 'TOML', json: 'JSON', xml: 'XML',
  bicep: 'Bicep', sol: 'Solidity', lean: 'Lean',
};

// Config/docs rather than "code": still counted, but not eligible for "top language".
export const NON_CODE = new Set(['Markdown', 'MDX', 'YAML', 'TOML', 'JSON', 'XML']);

const IGNORE = [
  /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|poetry\.lock|uv\.lock|composer\.lock|Gemfile\.lock|go\.sum|packages\.lock\.json)$/,
  /(^|\/)(node_modules|vendor|dist|build|out|\.next|\.nuxt|coverage|bin|obj|target|__pycache__|\.venv)\//,
  /\.min\.(js|css)$/, /\.map$/, /\.snap$/,
  /\.(svg|png|jpe?g|gif|webp|ico|pdf|mp[34]|wav|ogg|woff2?|ttf|otf|eot|zip|gz)$/i,
  /(^|\/)(migrations?|generated|__generated__)\//i, /\.g\.(cs|dart)$/, /\.designer\.cs$/i,
];

export function isIgnored(path) {
  return IGNORE.some((re) => re.test(path));
}

export function languageOf(path) {
  const base = path.split('/').pop().toLowerCase();
  if (base === 'dockerfile' || base.startsWith('dockerfile.')) return 'Docker';
  if (base === 'makefile') return 'Make';
  const ext = base.includes('.') ? base.split('.').pop() : '';
  return MAP[ext] ?? null;
}
