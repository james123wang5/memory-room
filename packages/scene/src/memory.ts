import type { RoomScene, MemoryCard } from './schema';

export function gateOpen(scene: RoomScene, gate?: { nodeId: string; minimum: number }) {
  return !gate || (scene.nodes.find(n => n.id === gate.nodeId)?.joint?.value ?? -1) >= gate.minimum;
}
export function nodeAccessible(scene: RoomScene, id: string): boolean {
  const visited = new Set<string>(); let current: string | null = id;
  while (current) {
    if (visited.has(current)) return false;
    visited.add(current);
    const n = scene.nodes.find(n => n.id === current);
    if (!n || !gateOpen(scene, n.visibleWhen)) return false;
    current = n.parent;
  }
  return true;
}
export function memoryAccessible(scene: RoomScene, card: MemoryCard) {
  return (!card.nodeId || nodeAccessible(scene, card.nodeId)) && gateOpen(scene, card.reveal);
}
export function referencedAssets(scene: RoomScene) {
  return new Set([...scene.nodes.flatMap(n => [n.asset, n.proxyAsset]), ...(scene.memories ?? []).flatMap(m => m.attachments.map(a => a.assetId))].filter((id): id is string => !!id));
}
export function searchMemories(scene: RoomScene, query: string, authoring: boolean) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return (scene.memories ?? []).filter(m => (authoring || memoryAccessible(scene, m)) && terms.every(term =>
    [m.title,m.body,m.date,...m.tags,scene.nodes.find(n => n.id === m.nodeId)?.name ?? ''].join('\n').toLocaleLowerCase().includes(term)))
    .sort((a,b) => (b.date || b.createdAt).localeCompare(a.date || a.createdAt));
}
