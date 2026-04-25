import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

type RequiredStory = {
  matrixRef: string;
  storyFileRef: string;
  exportName: string;
  line: number;
};

function walkStoryFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkStoryFiles(full));
      continue;
    }
    if (entry.endsWith(".stories.tsx")) out.push(full);
  }
  return out;
}

function collectStoryExports(storyFiles: string[]): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const exportRegex = /^\s*export\s+const\s+([A-Za-z0-9_]+)/gm;
  for (const file of storyFiles) {
    const content = readFileSync(file, "utf8");
    const exports = new Set<string>();
    for (const m of content.matchAll(exportRegex)) {
      exports.add(m[1]);
    }
    out.set(file, exports);
  }
  return out;
}

function parseMatrixRequirements(matrixPath: string): RequiredStory[] {
  const lines = readFileSync(matrixPath, "utf8").split(/\r?\n/);
  const requirements: RequiredStory[] = [];
  let lastStoryFileRef: string | null = null;

  const fullRefRegex = /`([^`]+\.stories\.tsx)#([A-Za-z0-9_]+)`/g;
  const shortRefRegex = /`\.\.\.#([A-Za-z0-9_]+)`/g;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";

    for (const m of line.matchAll(fullRefRegex)) {
      const storyFileRef = m[1];
      const exportName = m[2];
      lastStoryFileRef = storyFileRef;
      requirements.push({
        matrixRef: line.trim(),
        storyFileRef,
        exportName,
        line: i + 1,
      });
    }

    for (const m of line.matchAll(shortRefRegex)) {
      if (!lastStoryFileRef) continue;
      requirements.push({
        matrixRef: line.trim(),
        storyFileRef: lastStoryFileRef,
        exportName: m[1],
        line: i + 1,
      });
    }
  }

  return requirements;
}

function resolveMatrixPath(projectRoot: string): string | null {
  const candidates = [
    path.resolve(projectRoot, "docs/UX_STATE_MATRIX.md"),
    path.resolve(projectRoot, "../docs/UX_STATE_MATRIX.md"),
    path.resolve(projectRoot, "plan/UX_STATE_MATRIX.md"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function main(): void {
  const projectRoot = process.cwd();
  const matrixPath = resolveMatrixPath(projectRoot);
  const storiesRoot = path.resolve(projectRoot, "stories");

  if (!existsSync(storiesRoot)) {
    console.warn(`Story coverage check skipped: stories directory not found at ${storiesRoot}`);
    return;
  }

  if (!matrixPath) {
    console.warn(
      "Story coverage check skipped: UX_STATE_MATRIX.md not found in docs/ or plan/ directories.",
    );
    return;
  }

  const storyFiles = walkStoryFiles(storiesRoot);
  const exportsByFile = collectStoryExports(storyFiles);

  const filesByBase = new Map<string, string[]>();
  for (const file of storyFiles) {
    const base = path.basename(file);
    filesByBase.set(base, [...(filesByBase.get(base) ?? []), file]);
  }

  const requirements = parseMatrixRequirements(matrixPath);
  if (requirements.length === 0) {
    console.error("No story references found in UX_STATE_MATRIX.md.");
    process.exit(1);
  }

  const missing: string[] = [];

  for (const req of requirements) {
    const matchingFiles = filesByBase.get(req.storyFileRef) ?? [];
    if (matchingFiles.length === 0) {
      missing.push(
        `L${req.line}: missing file ${req.storyFileRef} (required export ${req.exportName})`,
      );
      continue;
    }

    const hasExport = matchingFiles.some((file) => {
      const exports = exportsByFile.get(file);
      return exports?.has(req.exportName) ?? false;
    });

    if (!hasExport) {
      missing.push(
        `L${req.line}: missing export ${req.storyFileRef}#${req.exportName}`,
      );
    }
  }

  if (missing.length > 0) {
    console.error("Story coverage check failed. Missing references:");
    for (const row of missing) {
      console.error(`- ${row}`);
    }
    process.exit(1);
  }

  console.log(
    `Story coverage check passed. Verified ${requirements.length} matrix references across ${storyFiles.length} story files.`,
  );
}

main();
