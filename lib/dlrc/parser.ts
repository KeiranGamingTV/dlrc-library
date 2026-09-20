export type DlrcLine = { timestampMs: number; speaker: string; color?: string; text: string };
export type ParsedDlrc = { title: string; artist: string; album: string; durationMs: number | null; colors: Record<string,string>; lines: DlrcLine[]; version: string; warnings: string[] };

const HEX = /^#[0-9a-fA-F]{6}$/;
function timestampToMs(value: string) {
  const match = value.match(/^(\d+):(\d{2})\.(\d{1,3})$/);
  if (!match) return null;
  const ms = Number(match[3].padEnd(3, '0'));
  return Number(match[1]) * 60000 + Number(match[2]) * 1000 + ms;
}
function durationToMs(value: string) {
  const match = value.trim().match(/^(\d+):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) return null;
  if (match[3] !== undefined) return (Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])) * 1000;
  return (Number(match[1]) * 60 + Number(match[2])) * 1000;
}

export function parseDlrc(content: string): ParsedDlrc {
  const lines = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
  const warnings: string[] = [];
  const colors: Record<string,string> = {};
  let title = '', artist = '', album = '', durationMs: number | null = null;
  const lyricLines: DlrcLine[] = [];
  let inLyrics = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const meta = line.match(/^\[([^:]+):\s*(.*)\]$/);
    if (meta) {
      const key = meta[1].toLowerCase();
      const value = meta[2].trim();
      if (key === 'ti') title = value;
      else if (key === 'ar') artist = value;
      else if (key === 'al') album = value;
      else if (key === 'length') durationMs = durationToMs(value);
      continue;
    }
    const colorDef = line.match(/^\-\s*\[(#[0-9a-fA-F]{6}):\s*([^\]]+)\]$/);
    if (colorDef) { colors[colorDef[2].trim()] = colorDef[1].toUpperCase(); continue; }
    const lyric = line.match(/^\[(\d+:\d{2}\.\d{1,3})\]\{([^}]+)\}(?:<([^>]+)>)?\s?(.*)$/);
    if (lyric) {
      inLyrics = true;
      const timestampMs = timestampToMs(lyric[1]);
      if (timestampMs === null) { warnings.push(`Invalid timestamp: ${lyric[1]}`); continue; }
      const rawColor = lyric[3]?.trim();
      const color = rawColor ? (HEX.test(rawColor) ? rawColor.toUpperCase() : colors[rawColor]) : undefined;
      if (rawColor && !color) warnings.push(`Unknown color name: ${rawColor}`);
      lyricLines.push({ timestampMs, speaker: lyric[2].trim(), color, text: lyric[4] });
      continue;
    }
    if (inLyrics) warnings.push(`Unrecognized lyric line: ${line}`);
  }
  if (!title) warnings.push('Missing [ti:] title metadata.');
  if (!artist) warnings.push('Missing [ar:] artist metadata.');
  if (lyricLines.length === 0) warnings.push('No timestamped lyric lines found.');
  if (durationMs === null && lyricLines.length) warnings.push('No valid [length:] metadata found.');
  return { title, artist, album, durationMs, colors, lines: lyricLines, version: '1.0', warnings };
}

export function validateDlrc(parsed: ParsedDlrc) {
  const errors: string[] = [];
  if (!parsed.title) errors.push('A title is required.');
  if (!parsed.artist) errors.push('An artist is required.');
  if (parsed.lines.length === 0) errors.push('At least one timestamped lyric line is required.');
  for (let i=1;i<parsed.lines.length;i++) if (parsed.lines[i].timestampMs < parsed.lines[i-1].timestampMs) errors.push(`Timestamp order is invalid near lyric line ${i+1}.`);
  for (const [name, color] of Object.entries(parsed.colors)) if (!HEX.test(color)) errors.push(`Invalid color declaration for ${name}.`);
  return errors;
}
