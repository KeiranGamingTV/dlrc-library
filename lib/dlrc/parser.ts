export type DlrcLine = {
  timestampMs: number;
  speaker: string;
  color?: string;
  colorName?: string;
  text: string;
};

export type ParsedDlrc = {
  title: string;
  artist: string;
  album: string;
  durationMs: number | null;
  durationSource: 'metadata' | 'inferred' | 'missing';
  colors: Record<string, string>;
  metadata: Record<string, string>;
  lines: DlrcLine[];
  speakerIds: string[];
  version: string;
  warnings: string[];
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const TIMESTAMP = /^(\d+):(\d{2})\.(\d{1,3})$/;

function timestampToMs(value: string) {
  const match = value.match(TIMESTAMP);
  if (!match) return null;
  const ms = Number(match[3].padEnd(3, '0'));
  return Number(match[1]) * 60000 + Number(match[2]) * 1000 + ms;
}

function durationToMs(value: string) {
  const match = value.trim().match(/^(\d+):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) return null;
  if (match[3] !== undefined) {
    return (Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])) * 1000;
  }
  return (Number(match[1]) * 60 + Number(match[2])) * 1000;
}

export function parseDlrc(content: string): ParsedDlrc {
  const lines = content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const warnings: string[] = [];
  const colors: Record<string, string> = {};
  const metadata: Record<string, string> = {};
  const lyricLines: DlrcLine[] = [];
  const speakers = new Set<string>();
  let title = '';
  let artist = '';
  let album = '';
  let durationMs: number | null = null;
  let durationSource: ParsedDlrc['durationSource'] = 'missing';
  let inLyrics = false;

  lines.forEach((raw, index) => {
    const lineNumber = index + 1;
    const line = raw.trimEnd();
    if (!line.trim()) return;

    const meta = line.match(/^\[([^:\]]+):\s*(.*)\]$/);
    if (meta) {
      const key = meta[1].trim().toLowerCase();
      const value = meta[2].trim();
      if (!key) return;
      metadata[key] = value;
      if (key === 'ti') title = value;
      else if (key === 'ar') artist = value;
      else if (key === 'al') album = value;
      else if (key === 'length') {
        durationMs = durationToMs(value);
        if (durationMs === null) warnings.push(`Invalid [length:] value on line ${lineNumber}: ${value}`);
        else durationSource = 'metadata';
      }
      return;
    }

    const colorDef = line.match(/^\-\s*\[(#[0-9a-fA-F]{6}):\s*([^\]]+)\]$/);
    if (colorDef) {
      const name = colorDef[2].trim();
      if (!name) warnings.push(`Empty color name on line ${lineNumber}.`);
      else colors[name] = colorDef[1].toUpperCase();
      return;
    }

    const lyric = line.match(/^\[(\d+:\d{2}\.\d{1,3})\]\{([^}]+)\}(?:<([^>]+)>)?\s?(.*)$/);
    if (lyric) {
      inLyrics = true;
      const timestampMs = timestampToMs(lyric[1]);
      if (timestampMs === null) {
        warnings.push(`Invalid timestamp on line ${lineNumber}: ${lyric[1]}`);
        return;
      }

      const speaker = lyric[2].trim();
      if (!speaker) warnings.push(`Empty speaker assignment on line ${lineNumber}.`);
      else speakers.add(speaker);

      const rawColor = lyric[3]?.trim();
      const color = rawColor
        ? (HEX.test(rawColor) ? rawColor.toUpperCase() : colors[rawColor])
        : undefined;
      if (rawColor && !color) warnings.push(`Unknown color name on line ${lineNumber}: ${rawColor}`);

      lyricLines.push({
        timestampMs,
        speaker,
        color,
        colorName: rawColor && !HEX.test(rawColor) ? rawColor : undefined,
        text: lyric[4],
      });
      return;
    }

    if (inLyrics) warnings.push(`Unrecognized lyric line ${lineNumber}: ${line.trim()}`);
    else warnings.push(`Unrecognized header line ${lineNumber}: ${line.trim()}`);
  });

  if (!title) warnings.push('Missing [ti:] title metadata.');
  if (!artist) warnings.push('Missing [ar:] artist metadata.');
  if (lyricLines.length === 0) warnings.push('No timestamped lyric lines found.');

  if (durationMs === null && lyricLines.length) {
  const lastTimestamp = Math.max(
    ...lyricLines.map((line) => line.timestampMs)
  );

  durationMs = lastTimestamp;
  durationSource = 'inferred';

  warnings.push(
    'No valid [length:] metadata found; duration was inferred from the final lyric timestamp and may be shorter than the actual song.'
  );
}

if (
  declaredDurationMs !== null &&
  lyricLines.some((line) => line.timestampMs > declaredDurationMs)
) {
  warnings.push(
    'At least one lyric timestamp occurs after the declared duration.'
  );
}

  return {
    title,
    artist,
    album,
    durationMs,
    durationSource,
    colors,
    metadata,
    lines: lyricLines,
    speakerIds: [...speakers],
    version: metadata.version || metadata.dlrc || '1.0',
    warnings,
  };
}

export function validateDlrc(parsed: ParsedDlrc) {
  const errors: string[] = [];
  if (!parsed.title) errors.push('A title is required.');
  if (!parsed.artist) errors.push('An artist is required.');
  if (parsed.lines.length === 0) errors.push('At least one timestamped lyric line is required.');
  if (parsed.title.length > 300) errors.push('The title is too long.');
  if (parsed.artist.length > 300) errors.push('The artist name is too long.');
  if (parsed.album.length > 300) errors.push('The album name is too long.');
  for (let i = 1; i < parsed.lines.length; i++) {
    if (parsed.lines[i].timestampMs < parsed.lines[i - 1].timestampMs) {
      errors.push(`Timestamp order is invalid near lyric line ${i + 1}.`);
      break;
    }
  }
  for (const [name, color] of Object.entries(parsed.colors)) {
    if (!name || !HEX.test(color)) errors.push(`Invalid color declaration for ${name || 'unnamed color'}.`);
  }
  return errors;
}

export function formatDuration(ms: number | null) {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return '—';
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}
