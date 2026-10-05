import { readFileSync } from 'fs';
import { join } from 'path';

const CHATGPT_CHAR_LIMIT = 1500;

export function exportToChatGPT(manifest, packDir) {
  let output = '';

  // Persona - condensed for ChatGPT's limited space
  const persona = manifest.persona;
  if (persona) {
    if (persona.file) {
      try {
        output += readFileSync(join(packDir, persona.file), 'utf-8') + '\n\n';
      } catch {
        // skip
      }
    } else {
      if (persona.role) output += `Role: ${persona.role}\n`;
      if (persona.tone) output += `Tone: ${persona.tone}\n`;
      if (persona.expertise) output += `Expertise: ${persona.expertise.join(', ')}\n`;
      if (persona.instructions) output += `\n${persona.instructions}\n`;
      output += '\n';
    }
  }

  // Rules - condensed
  const rules = manifest.rules;
  if (rules) {
    output += 'Rules:\n';
    if (rules.file) {
      try {
        output += readFileSync(join(packDir, rules.file), 'utf-8') + '\n';
      } catch {
        // skip
      }
    } else if (rules.items) {
      for (const rule of rules.items) {
        output += `- ${rule}\n`;
      }
    }
  }

  // Truncate if needed
  const maxChars = manifest.exports?.chatgpt?.max_chars || CHATGPT_CHAR_LIMIT;
  if (output.length > maxChars) {
    output = output.substring(0, maxChars - 20) + '\n\n[...truncated]';
  }

  return output.trim() + '\n';
}
