import { getHighlightedTextParts } from "../../lib/teamsComponent";

export function HighlightedText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {getHighlightedTextParts(text, query).map((part, index) =>
        part.highlighted ? (
          <mark key={`${part.text}-${index}`}>{part.text}</mark>
        ) : (
          part.text
        ),
      )}
    </>
  );
}
