const SEGMENT_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const;
type SegmentName = (typeof SEGMENT_NAMES)[number];

const ACTIVE_SEGMENTS: Readonly<Record<string, readonly SegmentName[]>> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'd', 'e', 'g'],
  '3': ['a', 'b', 'c', 'd', 'g'],
  '4': ['b', 'c', 'f', 'g'],
  '5': ['a', 'c', 'd', 'f', 'g'],
  '6': ['a', 'c', 'd', 'e', 'f', 'g'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
};

interface SevenSegmentDisplayProps {
  value: number;
  tone: 'positive' | 'debt';
  title: string;
  compact?: boolean;
}

function SevenSegmentDigit({ value }: { value: string }) {
  const active = new Set(ACTIVE_SEGMENTS[value] ?? []);

  return (
    <span className="sevenSegmentDigit" aria-hidden="true">
      {SEGMENT_NAMES.map((segment) => (
        <i
          key={segment}
          className={`sevenSegment sevenSegment-${segment}${
            active.has(segment) ? ' lit' : ''
          }`}
        />
      ))}
    </span>
  );
}

export function SevenSegmentDisplay({
  value,
  tone,
  title,
  compact = false,
}: SevenSegmentDisplayProps) {
  const digits = String(Math.trunc(value));

  return (
    <output
      className={`sevenSegmentDisplay sevenSegment-${tone}${
        compact ? ' compact' : ''
      }`}
      aria-label={title}
      title={title}
    >
      <span className="sevenSegmentDigits" aria-hidden="true">
        {[...digits].map((digit, index) => (
          <SevenSegmentDigit key={`${digit}-${index}`} value={digit} />
        ))}
      </span>
    </output>
  );
}
