"use strict";

/**
 * Interval helpers used by the working-hours register.
 *
 * This file is read-only. You may import it from your solution:
 *
 *   const { overlapLength, coveredLength } = require("./intervals");
 */

/**
 * Length of the overlap between the session [start, end] and the window
 * [windowStart, windowEnd]. Returns 0 when they do not overlap.
 */
function overlapLength(start, end, windowStart, windowEnd) {
  return Math.max(0, Math.min(end, windowEnd) - Math.max(start, windowStart));
}

/**
 * Total length covered by the union of `periods` within [start, end].
 * `periods` is an array of `{ start, end }` objects. Overlapping and touching
 * periods are counted only once.
 */
function coveredLength(start, end, periods) {
  const intervals = [];
  for (const period of periods) {
    const from = Math.max(start, period.start);
    const to = Math.min(end, period.end);
    if (to > from) {
      intervals.push([from, to]);
    }
  }
  intervals.sort((a, b) => a[0] - b[0]);

  let total = 0;
  let currentStart = null;
  let currentEnd = null;
  for (const [from, to] of intervals) {
    if (currentStart === null) {
      currentStart = from;
      currentEnd = to;
    } else if (from <= currentEnd) {
      currentEnd = Math.max(currentEnd, to);
    } else {
      total += currentEnd - currentStart;
      currentStart = from;
      currentEnd = to;
    }
  }
  if (currentStart !== null) {
    total += currentEnd - currentStart;
  }
  return total;
}

module.exports = { overlapLength, coveredLength };
