import path from "node:path";
import { pathExists, readYaml, writeYaml } from "./fs-utils.js";
import { findPacket } from "./input.js";
import { projectRoot } from "./paths.js";
import { appendTrace } from "./trace.js";
import { nowIso } from "./time.js";

export interface BookProfile {
  title: string;
  synopsis: string;
  genre: string | null;
  tags: string[];
  source_input: string | null;
  updated_at: string;
}

export interface BookSetOptions {
  title: string;
  synopsis: string;
  genre?: string | null;
  tags?: string[];
  sourceInput?: string | null;
}

export async function readBookProfile(projectName: string): Promise<BookProfile> {
  const profilePath = bookProfilePath(projectName);
  if (!(await pathExists(profilePath))) {
    return defaultBookProfile(projectName);
  }
  const parsed = await readYaml<Partial<BookProfile>>(profilePath);
  return {
    title: parsed.title?.trim() || projectName,
    synopsis: parsed.synopsis?.trim() || "",
    genre: parsed.genre ?? null,
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter((item): item is string => typeof item === "string") : [],
    source_input: parsed.source_input ?? null,
    updated_at: parsed.updated_at ?? nowIso(),
  };
}

export async function setBookProfile(projectName: string, options: BookSetOptions): Promise<{ ok: true; profile: BookProfile; changed_files: string[] }> {
  const title = options.title.trim();
  if (!title) throw new Error("Book title cannot be empty.");
  const synopsis = options.synopsis.trim();
  if (!synopsis) throw new Error("Book synopsis cannot be empty.");

  if (options.sourceInput) {
    await findPacket(projectName, options.sourceInput);
  }

  const profile: BookProfile = {
    title,
    synopsis,
    genre: options.genre?.trim() || null,
    tags: options.tags ?? [],
    source_input: options.sourceInput ?? null,
    updated_at: nowIso(),
  };
  await writeYaml(bookProfilePath(projectName), profile);
  await appendTrace(projectName, {
    command: "book.set",
    input_id: options.sourceInput ?? undefined,
    artifacts: ["10_bible/book_profile.yaml"],
    metadata: { title, genre: profile.genre, tags: profile.tags },
  });
  return { ok: true, profile, changed_files: ["10_bible/book_profile.yaml"] };
}

export async function showBookProfile(projectName: string): Promise<{ ok: true; profile: BookProfile }> {
  return { ok: true, profile: await readBookProfile(projectName) };
}

function defaultBookProfile(projectName: string): BookProfile {
  return {
    title: projectName,
    synopsis: "",
    genre: null,
    tags: [],
    source_input: null,
    updated_at: nowIso(),
  };
}

function bookProfilePath(projectName: string): string {
  return path.join(projectRoot(projectName), "10_bible/book_profile.yaml");
}
