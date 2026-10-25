import { pinyin } from 'pinyin-pro';

/**
 * Converts Chinese text into Pinyin with tone marks.
 * Handles speaker labels (e.g., A: / B:) and emojis nicely.
 */
export function getChinesePinyin(chineseText?: string): string {
  if (!chineseText || !chineseText.trim()) return '';

  // If multi-line (e.g. dialogue): process line by line
  if (chineseText.includes('\n')) {
    return chineseText
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        const match = trimmed.match(/^([A-Za-z0-9_\u4e00-\u9fa5]+)\s*[:：]\s*(.*)$/);
        if (match) {
          const speaker = match[1];
          const content = match[2];
          return `${speaker}: ${pinyin(content, { toneType: 'symbol', nonZh: 'consecutive' })}`;
        }
        return pinyin(trimmed, { toneType: 'symbol', nonZh: 'consecutive' });
      })
      .join('\n');
  }

  return pinyin(chineseText, { toneType: 'symbol', nonZh: 'consecutive' });
}
