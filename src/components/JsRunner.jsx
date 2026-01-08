import { useState, useRef } from "react";

export default function JsRunner() {
  const [code, setCode] = useState("");
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Idle");
  const [time, setTime] = useState(null);

  const [promptText, setPromptText] = useState(null);
  const [promptValue, setPromptValue] = useState("");

  const promptResolver = useRef(null);
  const isRunning = useRef(false);
  const startTime = useRef(null);

  /* ---------- formatter ---------- */
  const format = val => {
    if (Array.isArray(val)) return `[array] ${JSON.stringify(val, null, 2)}`;
    if (typeof val === "object" && val !== null)
      return `[object] ${JSON.stringify(val, null, 2)}`;
    return `[${typeof val}] ${String(val)}`;
  };

  /* ---------- runner ---------- */
  const runCode = async () => {
    if (isRunning.current) return;

    setLogs([]);
    setError("");
    setTime(null);
    setStatus("Running...");
    isRunning.current = true;

    const output = [];

    const fakeConsole = {
      log: (...args) => {
        output.push(args.map(format).join(" "));
        setLogs([...output]);
      },
      warn: (...args) => {
        output.push("⚠ " + args.map(format).join(" "));
        setLogs([...output]);
      },
      error: (...args) => {
        output.push("❌ " + args.map(format).join(" "));
        setLogs([...output]);
      }
    };

    const fakePrompt = message =>
      new Promise(resolve => {
        setStatus("Waiting for input...");
        setPromptText(message);
        promptResolver.current = value => {
          resolve(value);
          setPromptText(null);
          setStatus("Running...");
        };
      });

    try {
      const wrapped = `
        "use strict";
        return async function(prompt, console) {
          ${code}
        }
      `;

      const executor = new Function(wrapped)();

      startTime.current = performance.now();

      await executor(fakePrompt, fakeConsole);

      const end = performance.now();
      setTime((end - startTime.current).toFixed(2));

      setLogs(output.length ? output : ["✅ Code executed successfully"]);
      setStatus("Completed");
    } catch (e) {
      setError(e.message);
      setStatus("Error");
    } finally {
      isRunning.current = false;
    }
  };

  /* ---------- submit prompt ---------- */
  const submitPrompt = () => {
    if (!promptResolver.current) return;
    promptResolver.current(promptValue);
    promptResolver.current = null;
    setPromptValue("");
  };

  const lineCount = code.split("\n").length;

  return (
    <div className="runner-wrapper">
      {/* CODE */}
      <div className="runner-section">
        <h3 className="runner-title">
          JavaScript Code ({lineCount} lines)
        </h3>

        <textarea
          className="runner-code"
          placeholder={`Write JavaScript code here.

Example:
const name = await prompt("Enter name");
console.log("Hello", name);`}
          value={code}
          onChange={e => setCode(e.target.value)}
        />
      </div>

      <button onClick={runCode} disabled={isRunning.current}>
        ▶ Run Code
      </button>

      {/* STATUS */}
      <div className="output-box">
        🔄 Status: {status}
        {time && ` | ⏱ ${time} ms`}
      </div>

      {/* PROMPT UI */}
      {promptText && (
        <div className="runner-section">
          <strong>{promptText}</strong>
          <input
            className="regex-input"
            value={promptValue}
            onChange={e => setPromptValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitPrompt()}
            autoFocus
          />
          <button onClick={submitPrompt} style={{ marginTop: 8 }}>
            Submit
          </button>
        </div>
      )}

      {/* OUTPUT */}
      {logs.length > 0 && (
        <div className="output-box">
          {logs.map((line, i) => (
            <pre key={i}>{line}</pre>
          ))}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="output-box error">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
