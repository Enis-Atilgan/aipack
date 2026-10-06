/**
 * PackAI Traitor-Tracing Watermark Engine
 * Encodes invisible zero-width Unicode signatures into prompt and markdown files
 * to trace leaks and identify copyright infringement without altering visible text.
 */

const ZW_ZERO = '\u200B';   // Zero-width space represents bit 0
const ZW_ONE = '\u200C';    // Zero-width non-joiner represents bit 1
const ZW_DELIM = '\u200D';  // Zero-width joiner represents delimiter
const ZW_MAGIC = '\uFEFF';  // Byte Order Mark / Header identifier

/**
 * Encodes payload string into invisible zero-width unicode sequence
 */
export function encodeZeroWidth(payload) {
  const binary = Array.from(Buffer.from(payload, 'utf-8'))
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join('');

  const encodedBits = Array.from(binary)
    .map(b => (b === '1' ? ZW_ONE : ZW_ZERO))
    .join('');

  return `${ZW_MAGIC}${ZW_DELIM}${encodedBits}${ZW_DELIM}`;
}

/**
 * Decodes invisible zero-width unicode sequence back to payload string
 */
export function decodeZeroWidth(text) {
  if (!text || typeof text !== 'string') return null;

  const startIndex = text.indexOf(`${ZW_MAGIC}${ZW_DELIM}`);
  if (startIndex === -1) return null;

  const contentStart = startIndex + 2;
  const endIndex = text.indexOf(ZW_DELIM, contentStart);
  if (endIndex === -1) return null;

  const bitString = text.slice(contentStart, endIndex);
  let binary = '';
  for (const char of bitString) {
    if (char === ZW_ZERO) binary += '0';
    else if (char === ZW_ONE) binary += '1';
  }

  if (binary.length === 0 || binary.length % 8 !== 0) return null;

  const bytes = [];
  for (let i = 0; i < binary.length; i += 8) {
    bytes.push(parseInt(binary.slice(i, i + 8), 2));
  }

  try {
    return Buffer.from(bytes).toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Injects invisible watermark into text content
 */
export function embedWatermark(content, payload) {
  const watermark = encodeZeroWidth(payload);
  // Insert at the first newline or prepend
  const nlIndex = content.indexOf('\n');
  if (nlIndex !== -1) {
    return content.slice(0, nlIndex) + watermark + content.slice(nlIndex);
  }
  return content + watermark;
}

/**
 * Extracts hidden watermark payload from content
 */
export function extractWatermark(content) {
  return decodeZeroWidth(content);
}
