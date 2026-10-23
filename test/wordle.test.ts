import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABC';

// Step 1: a generator for five-letter uppercase words.
const wordFrom = (letters: string) =>
  fc.array(fc.constantFrom(...letters), {minLength: 5, maxLength: 5}).map(cs=>cs.join(''));

const word = wordFrom(ALPHABET);

describe('matchGuess', () => {
  // Pattern: metamorphic. Renaming letters consistently preserves the result.

  it('preserves results when letters are swapped interchangably', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result1 = matchGuess(secret, guess);

        const swap = (text: string) =>
          [...text]
            .map(letter => (letter === 'A' ? 'B' : letter === 'B' ? 'A' : letter))
            .join('');
        const secret2 = swap(secret);
        const guess2 = swap(guess);

        const result2 = matchGuess(secret2, guess2);

        expect(result2).toEqual(result1);
      }),
    );
  });


  // Pattern: conditional. An available, non-correct match should be yellow.
  it('returns yellow if the letter is in the word and has not been credited', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);

        for (let i = 0; i < 5; i++) {
          const letter = guess[i];
          const available =
            // how many copies of that letter exist in the secret
            [...secret].filter(c => c === letter).length -
            // subtract copies already used by green matches
            [...secret].filter(
              (c, j) => c === letter && guess[j] === secret[j],
            ).length -
            // subtract copies already used by earlier yellow matches
            [...guess.slice(0, i)].filter(
              (c, j) => c === letter && result[j] === 'Y',
            ).length;

          if (guess[i] !== secret[i] && available > 0) {
            expect(result[i]).toBe('Y');
          }
        }
      }),
    );
  });

// Pattern: Invariant. The result always has five colors.
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        expect(matchGuess(secret, guess)).toHaveLength(5);
      }),
    );
  });

// Pattern: Invariant. Every color is G, Y, or B.
  it('only uses the colors G, Y, B', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        for (const c of matchGuess(secret, guess)) expect(['G', 'Y', 'B']).toContain(c);
      }),
    );
  });

  // Pattern: conditional. If the guess is the secret, every color is green.
  it('guessing the secret gives all greens', ()=> {
    fc.assert(
      fc.property(word, w => {
        expect(matchGuess(w, w)).toEqual(['G','G','G','G','G']);
      }),
    );
  });

  // it('guessing the secret gives all greens, filtering', () => {
  //   fc.assert(
  //     fc.property(word,word, (secret, guess) => {
  //       fc.pre(secret == guess); 
  //       expect(matchGuess(secret, guess)).toEqual(['G','G','G','G','G']);
  //     }),
  //   );
  // });

  // Pattern: Invariant. No letter is credited (G or Y) more times than the
  // secret contains it.
  it('never credits a letter more times than the secret contains it', ()=> {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const credited = [...guess].filter((c,i) => c === letter && result[i] !== 'B').length;
          const inSecret = [...secret].filter(c => c === letter).length;
          expect(credited).toBeLessThanOrEqual(inSecret);
        }
      }),
    );
  });
  
});
