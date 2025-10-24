/**
 * Fuzzy Matching Utility for Voice Commands
 * Handles mispronunciations and similar-sounding words
 */

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of edits needed to transform one string into another
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1, where 1 is exact match)
 */
export function similarityScore(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

/**
 * Find the best match from a list of options
 * Returns the best match and its similarity score
 */
export function findBestMatch(
  input: string,
  options: string[],
  threshold: number = 0.6
): { match: string | null; score: number; allMatches: Array<{ option: string; score: number }> } {
  const normalizedInput = input.toLowerCase().trim();
  
  // Calculate scores for all options
  const scores = options.map(option => ({
    option,
    score: similarityScore(normalizedInput, option.toLowerCase())
  }));
  
  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);
  
  // Return best match if it meets threshold
  const bestMatch = scores[0];
  if (bestMatch && bestMatch.score >= threshold) {
    return {
      match: bestMatch.option,
      score: bestMatch.score,
      allMatches: scores.filter(s => s.score >= threshold)
    };
  }
  
  return {
    match: null,
    score: 0,
    allMatches: scores.filter(s => s.score >= threshold)
  };
}

/**
 * Check if input contains any of the target words (with fuzzy matching)
 */
export function containsFuzzy(
  input: string,
  targets: string[],
  threshold: number = 0.7
): { found: boolean; matchedWord: string | null; score: number } {
  const words = input.toLowerCase().split(/\s+/);
  
  for (const word of words) {
    for (const target of targets) {
      const score = similarityScore(word, target.toLowerCase());
      if (score >= threshold) {
        return { found: true, matchedWord: target, score };
      }
    }
  }
  
  return { found: false, matchedWord: null, score: 0 };
}

/**
 * Phonetic similarity check for common Kinyarwanda-English pronunciation patterns
 */
export function normalizePhonetic(text: string): string {
  let normalized = text.toLowerCase();
  
  // Common pronunciation variations
  const replacements: [RegExp, string][] = [
    // R/L confusion (common in Kinyarwanda speakers)
    [/\br/g, '[rl]'],
    [/\bl/g, '[rl]'],
    
    // TH sounds often pronounced as T or D
    [/th/g, '[thd]'],
    
    // V/B confusion
    [/\bv/g, '[vb]'],
    [/\bb/g, '[vb]'],
    
    // Short vowels
    [/a+/g, 'a+'],
    [/e+/g, 'e+'],
    [/i+/g, 'i+'],
    [/o+/g, 'o+'],
    [/u+/g, 'u+'],
  ];
  
  for (const [pattern, replacement] of replacements) {
    normalized = normalized.replace(pattern, replacement);
  }
  
  return normalized;
}

/**
 * Advanced fuzzy match with phonetic awareness
 */
export function fuzzyMatchPhonetic(
  input: string,
  target: string,
  threshold: number = 0.65
): { match: boolean; score: number } {
  // First try exact similarity
  const exactScore = similarityScore(input, target);
  if (exactScore >= threshold) {
    return { match: true, score: exactScore };
  }
  
  // Try phonetic normalization
  const phoneticInput = normalizePhonetic(input);
  const phoneticTarget = normalizePhonetic(target);
  const phoneticScore = similarityScore(phoneticInput, phoneticTarget);
  
  return {
    match: phoneticScore >= threshold,
    score: Math.max(exactScore, phoneticScore)
  };
}
