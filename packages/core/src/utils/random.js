export function random(start = 0, end) {
  if (typeof end === 'undefined') {
    end = start;
    start = 0;
  }
  return Math.floor(Math.random() * (end - start) + start);
}
