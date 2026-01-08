import { useState } from "react";

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [flags, setFlags] = useState("g");

  const testRegex = () => {
    setError("");
    setMatches([]);

    try {
      if (!pattern) return;

      const regex = new RegExp(pattern, flags);
      const lines = text.split("\n");

      let found = [];

      for (let line of lines) {
        if (!line.trim()) continue;

        // reset lastIndex for global regex
        if (flags.includes("g")) regex.lastIndex = 0;

        if (regex.test(line)) {
          found.push(line);
        }
      }

      setMatches(found);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="regex-wrapper">
      {/* Regex Pattern */}
      <input
        className="regex-input"
        placeholder="Enter regex pattern (e.g. ^(?=.*[A-Z]).{8,}$)"
        value={pattern}
        onChange={e => setPattern(e.target.value)}
      />

      {/* Regex Flags */}
      <input
        className="regex-input"
        placeholder="Flags (g, i, m)"
        value={flags}
        onChange={e => setFlags(e.target.value)}
      />

      {/* Test Text */}
      <textarea
        className="regex-textarea"
        placeholder="Enter test string (each line tested separately)"
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <button onClick={testRegex}>Test Regex</button>

      {/* Error */}
      {error && <div className="output-box error">❌ {error}</div>}

      {/* Matches */}
      {!error && matches.length > 0 && (
        <div className="output-box">
          <strong>Matches Found: {matches.length}</strong>
          <ul className="regex-result">
            {matches.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* No Match */}
      {!error && pattern && matches.length === 0 && (
        <div className="output-box">No matches found</div>
      )}
    </div>
  );
}
