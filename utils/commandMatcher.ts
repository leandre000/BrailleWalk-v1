import { findBestMatch, containsFuzzy, fuzzyMatchPhonetic } from './fuzzyMatch';

export interface CommandMatch {
  command: string;
  confidence: number;
  matchedPhrase: string;
  suggestions?: string[];
}

export interface CommandDefinition {
  command: string;
  aliases: string[];
  description: string;
}

export const GLOBAL_COMMANDS: CommandDefinition[] = [
  {
    command: 'navigate',
    aliases: ['navigate', 'navigation', 'nav', 'walk', 'go', 'move', 'start walking', 'guide me', 'direction', 'directions'],
    description: 'Start navigation mode'
  },
  {
    command: 'scan',
    aliases: ['scan', 'camera', 'take picture', 'photo', 'capture', 'look', 'see', 'identify', 'recognize', 'read'],
    description: 'Start scan mode'
  },
  {
    command: 'emergency',
    aliases: ['emergency', 'help', 'call', 'sos', 'urgent', 'need help', 'assistance', 'caregiver', 'contact'],
    description: 'Open emergency contacts'
  },
  {
    command: 'repeat',
    aliases: ['repeat', 'again', 'say again', 'instructions', 'what', 'pardon', 'sorry'],
    description: 'Repeat instructions'
  },
  {
    command: 'back',
    aliases: ['back', 'go back', 'return', 'previous', 'exit', 'quit', 'close', 'stop'],
    description: 'Go back or exit'
  },
];

export const NAVIGATION_COMMANDS: CommandDefinition[] = [
  {
    command: 'pause',
    aliases: ['pause', 'stop', 'wait', 'hold', 'hold on'],
    description: 'Pause navigation'
  },
  {
    command: 'resume',
    aliases: ['resume', 'continue', 'go', 'start', 'proceed', 'keep going'],
    description: 'Resume navigation'
  },
  {
    command: 'repeat',
    aliases: ['repeat', 'again', 'say again', 'what'],
    description: 'Repeat last instruction'
  },
  {
    command: 'exit',
    aliases: ['exit', 'quit', 'stop', 'end', 'finish', 'back', 'go back'],
    description: 'Exit navigation'
  },
];

export const SCAN_COMMANDS: CommandDefinition[] = [
  {
    command: 'scan',
    aliases: ['scan', 'capture', 'take', 'photo', 'picture', 'now'],
    description: 'Take a scan'
  },
  {
    command: 'text',
    aliases: ['text', 'read', 'ocr', 'words', 'letters', 'reading'],
    description: 'Switch to text mode'
  },
  {
    command: 'object',
    aliases: ['object', 'thing', 'item', 'identify', 'what is this', 'recognize'],
    description: 'Switch to object mode'
  },
  {
    command: 'barcode',
    aliases: ['barcode', 'qr', 'qr code', 'code', 'product'],
    description: 'Switch to barcode mode'
  },
  {
    command: 'auto',
    aliases: ['auto', 'automatic', 'continuous', 'auto scan', 'keep scanning'],
    description: 'Toggle auto scan'
  },
  {
    command: 'manual',
    aliases: ['manual', 'stop auto', 'manual mode', 'one by one'],
    description: 'Switch to manual mode'
  },
  {
    command: 'pause',
    aliases: ['pause', 'stop', 'wait', 'hold', 'hold on'],
    description: 'Pause scanning'
  },
  {
    command: 'resume',
    aliases: ['resume', 'continue', 'go', 'start', 'proceed', 'keep going'],
    description: 'Resume scanning'
  },
  {
    command: 'exit',
    aliases: ['exit', 'quit', 'back', 'close', 'done', 'finish'],
    description: 'Exit scan mode'
  },
];

export const EMERGENCY_COMMANDS: CommandDefinition[] = [
  {
    command: 'call_first',
    aliases: ['call first', 'first contact', 'primary', 'call primary', 'nearest', 'closest'],
    description: 'Call first contact'
  },
  {
    command: 'end_call',
    aliases: ['end', 'end call', 'hang up', 'stop', 'finish', 'disconnect'],
    description: 'End current call'
  },
  {
    command: 'back',
    aliases: ['back', 'go back', 'return', 'exit', 'cancel'],
    description: 'Go back to dashboard'
  },
];

export function matchCommand(
  input: string,
  commands: CommandDefinition[],
  threshold: number = 0.65
): CommandMatch | null {
  const normalizedInput = input.toLowerCase().trim();
  
  // Try exact match first
  for (const cmd of commands) {
    for (const alias of cmd.aliases) {
      if (normalizedInput === alias.toLowerCase()) {
        return {
          command: cmd.command,
          confidence: 1.0,
          matchedPhrase: alias,
        };
      }
    }
  }
  
  // Try contains match (for phrases)
  for (const cmd of commands) {
    for (const alias of cmd.aliases) {
      if (normalizedInput.includes(alias.toLowerCase()) || alias.toLowerCase().includes(normalizedInput)) {
        const words = normalizedInput.split(/\s+/);
        const aliasWords = alias.toLowerCase().split(/\s+/);
        const matchRatio = words.filter(w => aliasWords.includes(w)).length / Math.max(words.length, aliasWords.length);
        
        if (matchRatio > 0.5) {
          return {
            command: cmd.command,
            confidence: 0.9,
            matchedPhrase: alias,
          };
        }
      }
    }
  }
  
  // Try fuzzy matching with phonetic awareness
  let bestMatch: CommandMatch | null = null;
  let bestScore = 0;
  
  for (const cmd of commands) {
    for (const alias of cmd.aliases) {
      const result = fuzzyMatchPhonetic(normalizedInput, alias, threshold);
      if (result.match && result.score > bestScore) {
        bestScore = result.score;
        bestMatch = {
          command: cmd.command,
          confidence: result.score,
          matchedPhrase: alias,
        };
      }
    }
  }
  
  if (bestMatch) {
    return bestMatch;
  }
  
  // Try word-by-word fuzzy matching
  const inputWords = normalizedInput.split(/\s+/);
  for (const cmd of commands) {
    for (const alias of cmd.aliases) {
      const aliasWords = alias.toLowerCase().split(/\s+/);
      
      for (const inputWord of inputWords) {
        const wordMatch = containsFuzzy(inputWord, aliasWords, threshold);
        if (wordMatch.found && wordMatch.score > bestScore) {
          bestScore = wordMatch.score;
          bestMatch = {
            command: cmd.command,
            confidence: wordMatch.score,
            matchedPhrase: alias,
          };
        }
      }
    }
  }
  
  return bestMatch;
}

/**
 * Get suggestions for unrecognized commands
 */
export function getSuggestions(
  input: string,
  commands: CommandDefinition[],
  maxSuggestions: number = 3
): string[] {
  const normalizedInput = input.toLowerCase().trim();
  const suggestions: Array<{ alias: string; score: number }> = [];
  
  for (const cmd of commands) {
    for (const alias of cmd.aliases) {
      const result = fuzzyMatchPhonetic(normalizedInput, alias, 0.3); // Lower threshold for suggestions
      suggestions.push({
        alias,
        score: result.score,
      });
    }
  }
  
  // Sort by score and return top suggestions
  suggestions.sort((a, b) => b.score - a.score);
  return suggestions
    .slice(0, maxSuggestions)
    .map(s => s.alias);
}

/**
 * Match emergency contact name with fuzzy matching
 */
export function matchContactName(
  input: string,
  contactNames: string[],
  threshold: number = 0.6
): { name: string | null; confidence: number } {
  const normalizedInput = input.toLowerCase().trim();
  
  // Remove "call" prefix if present
  const cleanInput = normalizedInput
    .replace(/^(call|phone|ring|dial)\s+/i, '')
    .trim();
  
  const result = findBestMatch(cleanInput, contactNames, threshold);
  
  return {
    name: result.match,
    confidence: result.score,
  };
}

/**
 * Parse complex commands (e.g., "call John")
 */
export function parseComplexCommand(
  input: string,
  commands: CommandDefinition[]
): { action: string | null; parameter: string | null; confidence: number } {
  const normalizedInput = input.toLowerCase().trim();
  
  // Try to match action verbs
  const actionMatch = matchCommand(normalizedInput, commands, 0.65);
  
  if (!actionMatch) {
    return { action: null, parameter: null, confidence: 0 };
  }
  
  // Extract parameter (e.g., contact name after "call")
  const words = normalizedInput.split(/\s+/);
  if (words.length > 1) {
    // Remove the action word and get the rest as parameter
    const actionWords = actionMatch.matchedPhrase.toLowerCase().split(/\s+/);
    const parameterWords = words.filter(w => !actionWords.includes(w));
    const parameter = parameterWords.join(' ');
    
    return {
      action: actionMatch.command,
      parameter: parameter || null,
      confidence: actionMatch.confidence,
    };
  }
  
  return {
    action: actionMatch.command,
    parameter: null,
    confidence: actionMatch.confidence,
  };
}
