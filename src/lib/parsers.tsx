import { Fragment } from "react/jsx-runtime";

interface StyledSegment {
  text: string;
  className?: string;
}

class Parsers {
  static parseStyledText(text: string): React.ReactNode[] {
    const regex = /\{([^:}]+):([^}]+)\}/g;

    const segments: StyledSegment[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          text: text.slice(lastIndex, match.index),
        });
      }

      segments.push({
        text: match[2],
        className: match[1],
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push({
        text: text.slice(lastIndex),
      });
    }

    if (segments.length === 0) {
      return [text];
    }

    return segments.flatMap((segment, idx) => {
      const lines = segment.text.split("\n");

      return lines.map((line, lineIdx) => (
        <Fragment key={`${idx}-${lineIdx}`}>
          {segment.className ? (
            <span className={segment.className}>{line}</span>
          ) : (
            line
          )}
          {lineIdx < lines.length - 1 && <br />}
        </Fragment>
      ));
    });
  }
}

export default Parsers;
