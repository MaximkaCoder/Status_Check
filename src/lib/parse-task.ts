import * as chrono from "chrono-node";

// Translate common Ukrainian date expressions to English for chrono-node
function ukrainianToEnglish(text: string): string {
  let t = text;

  // Relative phrases (order matters — longer first)
  const phrases: [RegExp, string][] = [
    [/через\s+два\s+тижні/gi,   "in 2 weeks"],
    [/через\s+три\s+тижні/gi,   "in 3 weeks"],
    [/через\s+два\s+місяці/gi,  "in 2 months"],
    [/через\s+три\s+місяці/gi,  "in 3 months"],
    [/через\s+два\s+дні/gi,     "in 2 days"],
    [/через\s+три\s+дні/gi,     "in 3 days"],
    [/через\s+тиждень/gi,       "in 1 week"],
    [/через\s+місяць/gi,        "in 1 month"],
    [/через\s+день/gi,          "in 1 day"],
    [/наступного\s+тижня/gi,    "next week"],
    [/наступного\s+місяця/gi,   "next month"],
    [/наступної\s+неділі/gi,    "next sunday"],
    [/наступної\s+суботи/gi,    "next saturday"],
    [/сьогодні/gi,              "today"],
    [/завтра/gi,                "tomorrow"],
    [/вчора/gi,                 "yesterday"],
  ];
  phrases.forEach(([re, en]) => { t = t.replace(re, en); });

  // Months (genitive & nominative)
  const months: [RegExp, string][] = [
    [/січн[яь]/gi,              "january"],
    [/лютого|лютий/gi,          "february"],
    [/березн[яь]/gi,            "march"],
    [/квітн[яь]/gi,             "april"],
    [/травн[яь]/gi,             "may"],
    [/червн[яь]/gi,             "june"],
    [/липн[яь]/gi,              "july"],
    [/серпн[яь]/gi,             "august"],
    [/вересн[яь]/gi,            "september"],
    [/жовтн[яь]/gi,             "october"],
    [/листопада|листопад/gi,    "november"],
    [/грудн[яь]/gi,             "december"],
  ];
  months.forEach(([re, en]) => { t = t.replace(re, en); });

  // Days of week
  const days: [RegExp, string][] = [
    [/понеділк[уа]|понеділок/gi,  "monday"],
    [/вівторк[уа]|вівторок/gi,    "tuesday"],
    [/серед[іу]|середа/gi,        "wednesday"],
    [/четвер(?:га)?/gi,           "thursday"],
    [/п['']ятниц[іюя]|п['']ятниця/gi, "friday"],
    [/субот[ию]|субота/gi,        "saturday"],
    [/неділ[іюя]|неділя/gi,       "sunday"],
  ];
  days.forEach(([re, en]) => { t = t.replace(re, en); });

  // Numbers
  const nums: [RegExp, string][] = [
    [/\bодин\b/gi, "1"], [/\bдва\b/gi, "2"], [/\bтри\b/gi, "3"],
    [/\bчотири\b/gi, "4"], [/\bп['']ять\b/gi, "5"],
    [/\bшість\b/gi, "6"], [/\bсім\b/gi, "7"], [/\bвісім\b/gi, "8"],
    [/\bдев['']ять\b/gi, "9"], [/\bдесять\b/gi, "10"],
  ];
  nums.forEach(([re, en]) => { t = t.replace(re, en); });

  // Connector words
  t = t.replace(/\bдо\b/gi, "by");
  t = t.replace(/\bо\b(?=\s+\d)/gi, "at");

  return t;
}

function extractTitleAndDeadline(
  original: string,
  parsed: string,
  referenceDate: Date
): { title: string; deadline?: Date } | null {
  const results = chrono.parse(parsed, referenceDate, { forwardDate: true });
  if (results.length === 0) return null;

  const match = results[0];
  // Map matched position back to original text by character offset
  const withoutDate = parsed.replace(match.text, "");
  const remaining = withoutDate
    .replace(/\b(by|until|at|on|in)\b/gi, "")  // English connectors
    .replace(/\b(до|о|в|на)\b/gi, "")           // Ukrainian connectors
    .replace(/[,;]+/g, " ")                      // leftover separators
    .replace(/\s+/g, " ")
    .trim();

  if (remaining.length < 2) return null;
  return { title: remaining, deadline: match.start.date() };
}

interface StructuredFields {
  project?: string
  assignee?: string
  reviewer?: string
  remaining: string
}

function extractStructuredFields(text: string): StructuredFields {
  let remaining = text
  let project: string | undefined
  let assignee: string | undefined
  let reviewer: string | undefined

  const patterns: [RegExp, (v: string) => void][] = [
    [/(?:проєкт|project)\s*[:=]\s*([^,;\n]+?)(?=\s*(?:виконавець|assignee|перевіряючий|reviewer|,|;|\n|$))/i, (v) => { project = v.trim() }],
    [/(?:виконавець|assignee|відповідальний)\s*[:=]\s*([^,;\n]+?)(?=\s*(?:проєкт|project|перевіряючий|reviewer|,|;|\n|$))/i, (v) => { assignee = v.trim() }],
    [/(?:перевіряючий|reviewer)\s*[:=]\s*([^,;\n]+?)(?=\s*(?:проєкт|project|виконавець|assignee|,|;|\n|$))/i, (v) => { reviewer = v.trim() }],
  ]

  for (const [re, setter] of patterns) {
    const m = remaining.match(re)
    if (m) {
      setter(m[1])
      remaining = remaining.replace(m[0], '').trim()
    }
  }

  // Clean up leftover separators and whitespace
  remaining = remaining
    .replace(/[,;]\s*[,;]/g, ',')   // ", ," → ","
    .replace(/^\s*[,;]\s*/g, '')    // leading comma
    .replace(/[,;]\s*$/g, '')       // trailing comma
    .replace(/\s+/g, ' ')
    .trim()

  return { project, assignee, reviewer, remaining }
}

export function parseTask(
  text: string,
  referenceDate: Date
): { title: string; deadline?: Date; project?: string; assignee?: string; reviewer?: string } {
  // Extract structured fields first
  const { project, assignee, reviewer, remaining } = extractStructuredFields(text)
  const cleanText = remaining || text.trim()

  // Try English first
  const enResult = extractTitleAndDeadline(cleanText, cleanText, referenceDate);
  if (enResult) return { ...enResult, project, assignee, reviewer };

  // Try Ukrainian → English translation
  const translated = ukrainianToEnglish(cleanText);
  if (translated !== cleanText) {
    const ukResult = extractTitleAndDeadline(cleanText, translated, referenceDate);
    if (ukResult) return { ...ukResult, project, assignee, reviewer };
  }

  // No date found — return full text as title
  return { title: cleanText, project, assignee, reviewer };
}
