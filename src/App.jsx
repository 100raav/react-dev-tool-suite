import { useState } from "react";
import Tabs from "./components/Tabs";
import CodeEditor from "./components/CodeEditor";
import RegexTester from "./components/RegexTester";
import JsRunner from "./components/JsRunner";
import Footer from "./components/Footer";
import "./index.css";

export default function App() {
  const [active, setActive] = useState("Editor");

  return (
    <div className="app">
      <div className="container">
        <h1>⚡ React Dev Tool Suite</h1>

        <Tabs active={active} setActive={setActive} />

        {active === "Editor" && <CodeEditor />}
        {active === "Regex" && <RegexTester />}
        {active === "Runner" && <JsRunner />}
      </div>

      <Footer />
    </div>
  );
}
