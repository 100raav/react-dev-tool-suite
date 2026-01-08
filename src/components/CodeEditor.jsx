import { useState, useRef, useEffect } from "react";

/* =========================
   SYNTAX ANALYZER
========================= */
function analyzeSyntax(code) {
  const stack = [];
  const lines = code.split("\n");
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines[i].length; j++) {
      const ch = lines[i][j];
      const prev = lines[i][j - 1];

      if ((ch === '"' || ch === "'") && prev !== "\\") {
        if (!inString) {
          inString = true;
          stringChar = ch;
        } else if (ch === stringChar) {
          inString = false;
        }
        continue;
      }

      if (inString) continue;

      if (ch === "{" || ch === "(") {
        stack.push({ ch, line: i + 1, col: j + 1 });
      }

      if (ch === "}" || ch === ")") {
        const last = stack.pop();
        if (
          !last ||
          (ch === "}" && last.ch !== "{") ||
          (ch === ")" && last.ch !== "(")
        ) {
          return {
            error: `Extra '${ch}'`,
            line: i + 1,
            col: j + 1,
          };
        }
      }
    }
  }

  if (stack.length) {
    const last = stack[stack.length - 1];
    return {
      error: `Missing closing '${last.ch === "{" ? "}" : ")"}'`,
      line: last.line,
      col: last.col,
    };
  }

  return null;
}

/* =========================
   AST (TOKEN VIEW)
========================= */
function generateAST(code) {
  return code
    .split(/\s+/)
    .filter(Boolean)
    .map((token, i) => ({
      id: i,
      type: isNaN(token) ? "Identifier" : "Number",
      value: token,
    }));
}

/* =========================
   CODE EDITOR
========================= */
export default function CodeEditor() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [output, setOutput] = useState("");
  const [showAST, setShowAST] = useState(false);

  const [promptText, setPromptText] = useState(null);
  const [promptValue, setPromptValue] = useState("");
  const promptResolver = useRef(null);

  const textareaRef = useRef(null);
  const lineRef = useRef(null);

  /* Auto grow editor */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      textareaRef.current.scrollHeight + "px";
  }, [code]);

  const lines = code.split("\n");

  const handleChange = e => {
    const val = e.target.value;
    setCode(val);
    setError(analyzeSyntax(val));
    setOutput("");
  };

  const handleScroll = () => {
    if (lineRef.current && textareaRef.current) {
      lineRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  /* =========================
     RUN CODE (ASYNC + PROMPT)
  ========================= */
  const runCode = async () => {
    if (error) {
      setOutput("❌ Fix syntax errors before running.");
      return;
    }

    try {
      let logs = [];
      const originalLog = console.log;

      console.log = (...args) => {
        logs.push(
          args
            .map(a =>
              typeof a === "object"
                ? JSON.stringify(a, null, 2)
                : String(a)
            )
            .join(" ")
        );
      };

      const fakePrompt = message =>
        new Promise(resolve => {
          setPromptText(message);
          promptResolver.current = resolve;
        });

      const wrapped = `
        return async function(prompt, console) {
          ${code}
        }
      `;

      const executor = new Function(wrapped)();
      await executor(fakePrompt, console);

      console.log = originalLog;
      setOutput(logs.join("\n") || "✅ Code executed successfully");
    } catch (err) {
      setOutput("❌ " + err.message);
    }
  };

  const submitPrompt = () => {
    if (!promptResolver.current) return;
    promptResolver.current(promptValue);
    setPromptValue("");
    setPromptText(null);
    promptResolver.current = null;
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <div className="editor-wrapper">
        <div className="line-numbers" ref={lineRef}>
          {lines.map((_, i) => (
            <div
              key={i}
              style={{
                color: error?.line === i + 1 ? "#ff5252" : "#777",
                fontWeight: error?.line === i + 1 ? "bold" : "normal",
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="editor-content">
          {code === "" && (
            <div className="editor-placeholder">
              write code here...
            </div>
          )}

          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={code}
            onChange={handleChange}
            onScroll={handleScroll}
            spellCheck={false}
          />
        </div>
      </div>

      {/* SYNTAX ERROR */}
      {error && (
        <div className="output-box error">
          ❌ {error.error} at line {error.line}, column {error.col}
        </div>
      )}

      {/* CONTROLS */}
      <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
        <button onClick={runCode}>▶ Run</button>
        <button onClick={() => setShowAST(!showAST)}>
          {showAST ? "Hide AST" : "Show AST"}
        </button>
      </div>

      {/* PROMPT INPUT */}
      {promptText && (
        <div className="output-box">
          <strong>{promptText}</strong>
          <input
            className="regex-input"
            value={promptValue}
            onChange={e => setPromptValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitPrompt()}
            autoFocus
          />
          <button onClick={submitPrompt} style={{ marginTop: "8px" }}>
            Submit
          </button>
        </div>
      )}

      {/* OUTPUT */}
      {output && <div className="output-box">{output}</div>}

      {/* AST VIEW */}
      {showAST && (
        <div className="output-box">
          <strong>AST (Token View)</strong>
          <pre>{JSON.stringify(generateAST(code), null, 2)}</pre>
        </div>
      )}
    </>
  );
}
