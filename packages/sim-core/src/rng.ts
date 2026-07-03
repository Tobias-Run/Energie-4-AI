/**
 * Deterministic PRNG (mulberry32). The default run is fully deterministic and does not
 * consume random numbers; the RNG exists for Monte Carlo mode (P2) and is seeded per run
 * to satisfy the reproducibility requirement (mission document §7).
 */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
