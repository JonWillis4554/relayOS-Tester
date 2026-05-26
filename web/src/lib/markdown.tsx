// Tiny markdown subset renderer: **bold**, *italic*, and newlines.
// Everything else is emitted verbatim. Output goes through React children
// (NEVER dangerouslySetInnerHTML), so escaping is handled by React.
import { Fragment, ReactNode } from 'react';

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let buf = '';
  let i = 0;
  const flush = (): void => { if (buf) { nodes.push(buf); buf = ''; } };

  while (i < text.length) {
    // **bold** — try the longer marker first.
    if (text[i] === '*' && text[i + 1] === '*') {
      const close = text.indexOf('**', i + 2);
      if (close > i + 2) {
        flush();
        nodes.push(<strong key={nodes.length}>{parseInline(text.slice(i + 2, close))}</strong>);
        i = close + 2;
        continue;
      }
    }
    // *italic*
    if (text[i] === '*') {
      const close = text.indexOf('*', i + 1);
      if (close > i + 1) {
        flush();
        nodes.push(<em key={nodes.length}>{parseInline(text.slice(i + 1, close))}</em>);
        i = close + 1;
        continue;
      }
    }
    // Unmatched * or anything else → literal.
    buf += text[i++];
  }
  flush();
  return nodes;
}

export default function Markdown({ text }: { text: string }) {
  // Blank line (≥1 fully-blank line) splits paragraphs; a single newline
  // inside a paragraph becomes a <br/>.
  const paragraphs = text.split(/\n[ \t]*\n+/);
  return (
    <>
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n');
        const isLast = pi === paragraphs.length - 1;
        return (
          <p key={pi} style={{ margin: 0, marginBottom: isLast ? 0 : '0.6em' }}>
            {lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {parseInline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
