import React from 'react';

// Supports: fenced code blocks (triple backticks), inline code, bold, italic.
export default function RenderMarkdown(md: string) {
    // Replace tabs
    const input = md.replace(/\t/g, "    ");

    const elements: Array<React.ReactNode> = [];
    const fence = "`".repeat(3);
    const fenceRegex = new RegExp(fence + "([\\s\\S]*?)" + fence, "g");
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Helper to render inline formatting for a plain text segment
    const renderInline = (text: string): Array<React.ReactNode> => {
        const nodes: Array<React.ReactNode> = [];
        // Split by inline code first
        const parts = text.split(/`([^`]+)`/g);
        parts.forEach((part, i) => {
            if (i % 2 === 1) {
                // Inline code
                nodes.push(
                    <code key={`ic-${i}-${part}`} className="bg-muted px-1 py-0.5 rounded font-mono text-sm">
                        {part}
                    </code>
                );
            } else if (part) {
                // Then process bold and italic in the remaining text part
                // Bold **...**
                const boldRegex = /\*\*(.+?)\*\*/g;
                let bi = 0;
                let bmatch: RegExpExecArray | null;
                const boldNodes: Array<React.ReactNode> = [];
                while ((bmatch = boldRegex.exec(part)) !== null) {
                    const before = part.slice(bi, bmatch.index);
                    if (before) boldNodes.push(before);
                    boldNodes.push(
                        <strong key={`b-${i}-${bmatch.index}`} className="font-bold">{bmatch[1]}</strong>
                    );
                    bi = bmatch.index + bmatch[0].length;
                }
                const afterBold = part.slice(bi);

                // Italic *...* (surrounded by spaces or start/end)
                const italicRegex = /(^|\\s)\\*(.*?)\\*(?=\\s|$)/g;
                let ii = 0;
                let imatch: RegExpExecArray | null;
                const italicNodes: Array<React.ReactNode> = [];
                while ((imatch = italicRegex.exec(afterBold)) !== null) {
                    const beforeI = afterBold.slice(ii, imatch.index);
                    if (beforeI) italicNodes.push(beforeI);
                    italicNodes.push(
                        <React.Fragment key={`frag-i-${i}-${imatch.index}`}>
                            {imatch[1]}
                            <em key={`i-${i}-${imatch.index}`} className="italic">{imatch[2]}</em>
                        </React.Fragment>
                    );
                    ii = imatch.index + imatch[0].length;
                }
                const rest = afterBold.slice(ii);
                if (rest) italicNodes.push(rest);

                nodes.push(...(boldNodes.length ? boldNodes : italicNodes));
            }
        });
        return nodes;
    };

    // Iterate fenced code blocks
    // Push text before each fence, then the fence content as a pre/code block
    while ((match = fenceRegex.exec(input)) !== null) {
        const before = input.slice(lastIndex, match.index);
        if (before) elements.push(...renderInline(before));
        const codeContent = match[1];
        elements.push(
            <pre key={`pre-${match.index}`} className="whitespace-pre-wrap bg-muted rounded-lg p-3 overflow-x-auto text-sm my-2">
                <code>{codeContent}</code>
            </pre>
        );
        lastIndex = match.index + match[0].length;
    }

    const tail = input.slice(lastIndex);
    if (tail) elements.push(...renderInline(tail));

    return elements;
};
