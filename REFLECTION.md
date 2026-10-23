# Reflection

**Name / Andrew ID: kyleluo**


**Recitation group members (Task 2): N/A**

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

My metamorphic pattern for mergeIntervals (that tries a reversed list input order), is weak and does not currently kill a mutant. The only way this would catch a bug is if the implementation somehow depended on the interval list coming in in a certain order, which is not how mergeIntervals is currently implemented.

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

My original backwardsGenerator was:

const backwardsInterval: fc.Arbitrary<Interval> = fc.integer().chain(start =>
  fc.integer({ min: start + 1 }).map(end => [end, start]),
);
const backwardsList = fc.array(backwardsInterval);

The problems were that start could be fast-check’s maximum integer so "start + 1" was an invalid minimum, making fast-check say "invalid input" immediately. Also, fc.array() generated empty lists, which did not violate the sorted precondition, so there could be no throwing.

I fixed it by ensuring start wasn't maximum, and required non-empty lists.

The failed output was:

**Checking test/intervals.test.ts against the correct implementation (5 runs)...

1 test(s) FAIL on the correct implementation (false alarms):
  ✘ rejects intervals whose start is greater than their end  (failed in 5/5 runs)
      Counterexample: [[]]
      AssertionError: expected function to throw an error, but it didn't

Fix these first: either the property is not what the specification says,
or the generator produces inputs that break the preconditions.**

The fixed output was:

Checking test/intervals.test.ts against the correct implementation (5 runs)...
  ✔ all 8 test(s) pass

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

✔ touchingNotMerged       killed  by: rejects intervals whose start is greater than their end; merges intervals that share an endpoint
      Counterexample: [[[1,0]]]
      AssertionError: expected function to throw an error, but it didn't

The specification states that it "Merges a list of intervals into the smallest equivalent list of disjoint intervals." and that [1, 3] and [3, 5] touch at 3, so they merge into [1, 5]. My test creates touching inputs limited to [1, 10], which exposes this case.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.

In my team's project, the /stats opencode command I created could benefit from property-based testing.

Conditional Property: If no prompts have been sent in this session, /stats should report 0 queries. For this test, I would need a session object generator that creates a mock database that mirrors the opencode session database. A naive generator would generate all sorts of data beyond the scope of having absolutely zero data.

Metamorphic Property: Changing the assignment name in /stats parameter (such as /stats hw1) should not affect the result whatsoever, as naming is cosmetic. For this test, I would reuse the session object generator from the previous property, and allow it generate more mocks (this time, with prompt or chat data). A naive generator would do quite well here, but a maximum bounding on the number of prompts would prevent fastcheck from generating too many mock sessions.





