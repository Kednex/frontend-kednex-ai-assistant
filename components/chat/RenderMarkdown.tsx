import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function RenderMarkdown(md: string) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                // Open links in a new tab safely
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:opacity-80 break-all"
                    >
                        {children}
                    </a>
                ),
                // Render images inline with a reasonable max width
                img: ({ src, alt }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={src}
                        alt={alt || ''}
                        className="rounded-xl max-w-full my-2 border shadow-sm"
                        style={{ maxHeight: '320px', objectFit: 'contain' }}
                    />
                ),
                p: ({ children }) => (
                    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="italic">{children}</em>
                ),
                code: ({ children, className }) => (
                    className
                        ? <code className={className}>{children}</code>
                        : <code className="bg-muted px-1 py-0.5 rounded font-mono text-sm">{children}</code>
                ),
                pre: ({ children }) => (
                    <pre className="whitespace-pre-wrap bg-muted rounded-lg p-3 overflow-x-auto text-sm my-2">
                        {children}
                    </pre>
                ),
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
            }}
        >
            {md}
        </ReactMarkdown>
    );
}
