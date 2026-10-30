import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders article bodies. Raw HTML in the source is ignored by react-markdown, so content cannot inject markup. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-edu">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={["img"]}
        components={{
          a: ({ href, children: label }) => {
            const external = typeof href === "string" && /^https?:\/\//.test(href);
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
                {label}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
