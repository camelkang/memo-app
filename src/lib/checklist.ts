// Checklist items are ordinary lines of memo text that start with a box character,
// so they survive export, backup and search without any special handling.
export const UNCHECKED = '☐';
export const CHECKED = '☑';

type Edit = { text: string; cursor: number };

function lineBounds(text: string, cursor: number) {
  const start = text.lastIndexOf('\n', cursor - 1) + 1;
  const nextBreak = text.indexOf('\n', cursor);
  return { start, end: nextBreak === -1 ? text.length : nextBreak };
}

function boxOf(line: string) {
  return line.startsWith(`${UNCHECKED} `) ? UNCHECKED : line.startsWith(`${CHECKED} `) ? CHECKED : null;
}

/** Makes the cursor's line a checklist item, or flips it between done and not done. */
export function toggleCheck(text: string, cursor: number): Edit {
  const { start, end } = lineBounds(text, cursor);
  const line = text.slice(start, end);
  const box = boxOf(line);
  if (box === null) {
    return { text: `${text.slice(0, start)}${UNCHECKED} ${text.slice(start)}`, cursor: cursor + 2 };
  }
  const flipped = box === UNCHECKED ? CHECKED : UNCHECKED;
  return { text: `${text.slice(0, start)}${flipped}${text.slice(start + 1)}`, cursor };
}

/**
 * Called when the text changes. If the user just pressed Enter on a checklist line,
 * starts the next item for them; Enter on an empty item ends the list instead.
 * Returns null when the change is not such an Enter.
 */
export function continueChecklist(previous: string, next: string, cursor: number): Edit | null {
  const pressedEnter =
    next.length === previous.length + 1 &&
    next[cursor] === '\n' &&
    next.slice(0, cursor) === previous.slice(0, cursor) &&
    next.slice(cursor + 1) === previous.slice(cursor);
  if (!pressedEnter) return null;

  const { start } = lineBounds(previous, cursor);
  const before = previous.slice(start, cursor);
  if (boxOf(before) === null) return null;

  if (before.trim().length === 1) {
    // Empty item: remove the box and stay on this line.
    return { text: previous.slice(0, start) + previous.slice(cursor), cursor: start };
  }
  const insertAt = cursor + 1;
  return { text: `${next.slice(0, insertAt)}${UNCHECKED} ${next.slice(insertAt)}`, cursor: insertAt + 2 };
}

/** A checklist box on screen: where its line starts in the text, and how far down it is drawn. */
export type CheckBox = { offset: number; y: number; checked: boolean };

/**
 * Finds every checklist box and its vertical position, given how the text was
 * laid out on screen (one entry per visual line, wrapped lines included).
 */
export function findCheckBoxes(text: string, visualLines: { text: string; y: number }[]): CheckBox[] {
  const boxes: CheckBox[] = [];
  let position = 0;
  for (const line of visualLines) {
    const startsLine = position === 0 || text[position - 1] === '\n';
    if (startsLine) {
      const box = boxOf(text.slice(position, position + 2));
      if (box !== null) boxes.push({ offset: position, y: line.y, checked: box === CHECKED });
    }
    position += line.text.replace(/\n$/, '').length;
    if (text[position] === '\n') position += 1;
  }
  return boxes;
}
