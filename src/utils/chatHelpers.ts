export function isCasualOrGreeting(text: string): boolean {
  if (!text) return false;
  const cleaned = text.trim().toLowerCase().replace(/[^\w\s]/g, '');
  if (!cleaned) return false;

  const exactMatches = new Set([
    'hi', 'hii', 'hiii', 'hiiii', 'hello', 'hey', 'heyy', 'heyyy',
    'greetings', 'hola', 'howdy', 'yo',
    'date', 'time', 'today', 'help', 'thanks', 'thank you', 'bye', 'goodbye'
  ]);

  if (exactMatches.has(cleaned)) return true;

  const prefixMatches = [
    'hi ', 'hii ', 'hello ', 'hey ', 'good morning', 'good afternoon', 'good evening',
    'how are you', 'who are you', 'what are you', 'what can you do', 'what is your name',
    'what is the date', 'what is todays date', 'what is today date', 'current date', 'today date',
    'what time is it', 'tell me about yourself'
  ];

  return prefixMatches.some((prefix) => cleaned.startsWith(prefix) || cleaned === prefix.trim());
}

export function isDateQuery(text: string): boolean {
  if (!text) return false;
  const cleaned = text.trim().toLowerCase().replace(/[^\w\s]/g, '');
  const dateKeywords = [
    'date',
    'todays date',
    'today date',
    'current date',
    'what is the date',
    'what is todays date',
    'time',
    'what time is it'
  ];
  return dateKeywords.some((kw) => cleaned === kw || cleaned.includes(kw));
}
