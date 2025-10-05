import { marked } from "marked";

export function markdownToHtml(markdown: string = "") {
  const html = marked(markdown);

  return html as string;
}
