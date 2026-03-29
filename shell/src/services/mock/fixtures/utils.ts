export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function pick<T>(arr: T[], random: () => number): T {
  const item = arr[Math.floor(random() * arr.length)];
  if (item === undefined) throw new Error('pick: empty array');
  return item;
}
