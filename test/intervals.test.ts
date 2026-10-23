import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const interval: fc.Arbitrary<Interval> = fc.integer().chain(start =>
  fc.integer({ min: start }).map(end => [start, end]),
);
const intervalList = fc.array(interval);

// Backwards generator
const backwardsInterval: fc.Arbitrary<Interval> = fc.integer({ min: -1000, max: 999 }).chain(start =>
  fc.integer({ min: start + 1, max: 1000 }).map(end => [end, start]),
);
const backwardsList = fc.array(backwardsInterval, { minLength: 1 });

// Gap generator
const gappedPair: fc.Arbitrary<Interval[]> = fc.integer({ min: -1000, max: 500 }).chain(start =>
  fc.integer({ min: 0, max: 10 }).chain(width =>
    fc.integer({ min: 0, max: 10 }).chain(gap =>
      fc.integer({ min: 0, max: 10 }).map(secondWidth => [
        [start, start + width],
        [start + width + gap + 1, start + width + gap + 1 + secondWidth],
      ]),
    ),
  ),
);
// Overlapping pair generator

const overlappingPair: fc.Arbitrary<Interval[]> = fc.integer({ min: -1000, max: 500 }).chain(start =>
  fc.integer({ min: 1, max: 10 }).chain(firstWidth =>
    fc.integer({ min: 1, max: 10 }).map(secondWidth => [
      [start, start + firstWidth],
      [start + 1, start + firstWidth + secondWidth],
    ]),
  ),
);

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Add your properties here. Aim for at least one of each pattern:
  // invariant, algebraic, metamorphic, differential, conditional.

  // Pattern: conditional. An interval with start > end is rejected.
  it('rejects intervals whose start is greater than their end', () => {
    fc.assert(
      fc.property(backwardsList, xs => {
        expect(() => mergeIntervals(xs)).toThrow(RangeError);
      }),
    );
  });

  // Pattern: invariant. Output intervals are valid, sorted, and non-touching.
  it('returns sorted, non-touching intervals', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);

        for (let i = 0; i < out.length; i++) {
          expect(out[i][0]).toBeLessThanOrEqual(out[i][1]);
          if (i > 0) {
            expect(out[i - 1][0]).toBeLessThan(out[i][0]);
            expect(out[i - 1][1]).toBeLessThan(out[i][0]);
          }
        }
      }),
    );
  });

  // Pattern: conditional. Already gapped intervals remain separate.
  it('keeps gapped intervals separate', () => {
    fc.assert(
      fc.property(gappedPair, xs => {
        expect(mergeIntervals(xs)).toEqual(xs);
      }),
    );
  });

  // Pattern: conditional. Touching intervals are merged.
  it('merges intervals that share an endpoint', () => {
    fc.assert(
      fc.property(gappedPair, xs => {
        const [first, second] = xs;
        const touching: Interval[] = [
          first,
          [first[1], second[1]],
        ];
        expect(mergeIntervals(touching)).toEqual([[first[0], second[1]]]);
      }),
    );
  });

  // Pattern: invariant. Merging does not mutate the input intervals.
  it('does not mutate the input intervals', () => {
    fc.assert(
      fc.property(overlappingPair, xs => {
        const before = xs.map(([start, end]) => [start, end] as Interval);
        mergeIntervals(xs);
        expect(xs).toEqual(before);
      }),
    );
  });

  // Pattern: metamorphic. A reversed input has the same merged result.
  it('matches the result for the reversed input order', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        expect(mergeIntervals([...xs].reverse())).toEqual(mergeIntervals(xs));
      }),
    );
  });

  // Pattern: differential. Merging preserves randomly generated point coverage.
  
  function covers(intervals: Interval[], point: number): boolean {
    function containsPoint([start, end]: Interval): boolean {
      return start <= point && point <= end;
    }
    return intervals.some(containsPoint);
  }

  it('preserves randomized point coverage after merging', () => {
    fc.assert(
      fc.property(intervalList, fc.integer(), (xs, point) => {
        const out = mergeIntervals(xs);

        expect(covers(out, point)).toBe(covers(xs, point));
      }),
    );
  });

  
});
