function transformOutsideFencedCode(
  content: string,
  transform: (chunk: string) => string,
): string {
  const chunks: string[] = [];
  const outsideLines: string[] = [];
  const fenceLines: string[] = [];
  let inFence = false;
  let fenceChar = "";
  let fenceLength = 0;

  const flushOutside = () => {
    if (outsideLines.length === 0) return;
    chunks.push(transform(outsideLines.join("\n")));
    outsideLines.length = 0;
  };

  const flushFence = () => {
    if (fenceLines.length === 0) return;
    chunks.push(fenceLines.join("\n"));
    fenceLines.length = 0;
  };

  for (const line of content.split("\n")) {
    const fenceMatch = line.match(/^[ \t]{0,3}(`{3,}|~{3,})/);

    if (!inFence && fenceMatch) {
      flushOutside();
      inFence = true;
      fenceChar = fenceMatch[1][0];
      fenceLength = fenceMatch[1].length;
      fenceLines.push(line);
      continue;
    }

    if (inFence) {
      fenceLines.push(line);
      if (
        fenceMatch &&
        fenceMatch[1][0] === fenceChar &&
        fenceMatch[1].length >= fenceLength
      ) {
        inFence = false;
        fenceChar = "";
        fenceLength = 0;
        flushFence();
      }
      continue;
    }

    outsideLines.push(line);
  }

  flushOutside();
  flushFence();
  return chunks.join("\n");
}

/** 見出しの直前に空行を補い、ストリーミング中の Markdown 崩れを軽減する */
export function normalizeMarkdown(content: string): string {
  return transformOutsideFencedCode(content, (chunk) =>
    chunk
      .replace(/([^\n])(#{1,6} )/g, "$1\n\n$2")
      .replace(/([^\n])\n(#{1,6} )/g, "$1\n\n$2"),
  );
}
