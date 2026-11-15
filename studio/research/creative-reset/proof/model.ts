export type Reply = { id: string; status: 'agree' | 'unknown' };
export type Cue = { frame: number; kind: 'reply' | 'unfold' | 'edit' | 'echo'; reply?: string; pitch: number; pan: number };
export type Study = { id: string; duration: number; fps: number; replies: Reply[]; cues: Cue[]; silence: [number, number] };
export const study: Study = {
  id: 'editorial-scope-proof', duration: 16, fps: 24,
  replies: Array.from({ length: 12 }, (_, i) => ({ id: `R${String(i + 1).padStart(2, '0')}`, status: i < 4 ? 'agree' : 'unknown' })),
  cues: [
    ...[146.83, 174.61, 220, 293.66].map((pitch, i): Cue => ({ frame: 12 + i * 12, kind: 'reply', reply: `R0${i + 1}`, pitch, pan: -.35 + i * .2 })),
    { frame: 72, kind: 'unfold', pitch: 0, pan: 0 },
    { frame: 216, kind: 'edit', pitch: 0, pan: 0 },
    ...[146.83, 174.61, 220, 293.66].map((pitch, i): Cue => ({ frame: 240 + i * 12, kind: 'echo', pitch, pan: -.2 + i * .12 })),
  ],
  silence: [7, 9],
};
export function evidence(replies: Reply[]) {
  if (new Set(replies.map(r => r.id)).size !== replies.length) throw new Error('Repeated respondent identity');
  if (replies.some(r => !['agree', 'unknown'].includes(r.status))) throw new Error('Unsupported evidence state');
  const answered = replies.filter(r => r.status === 'agree');
  return { answered, unknown: replies.filter(r => r.status === 'unknown'), population: replies.length };
}
