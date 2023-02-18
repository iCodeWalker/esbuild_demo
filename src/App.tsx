import { useState, useEffect, useRef } from "react";
import * as esbuild from "esbuild-wasm";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchPlugin } from "./plugins/fetch-plugin";

import "./app.css";

const App = () => {
  const ref = useRef<any>();

  const [input, setInput] = useState<string>("");
  const [codeOutput, setCodeOutput] = useState<string>("");

  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: "https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm",
    });
  };

  useEffect(() => {
    startService();
  }, []);

  const onSubmitCode = async () => {
    if (!ref.current) {
      return;
    }

    //----- This transform function is used for tanspiling the jsx code into simple js ------

    // const result = await ref.current.transform(input, {
    //   loader: "jsx",
    //   target: "es2015",
    // });

    const result = await ref.current.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        "process.env.NODE_ENV": '"production"',
        global: "window",
      },
    });

    setCodeOutput(result.outputFiles[0].text); // Our transpiled and bundled code
  };

  return (
    <div style={{ margin: 16 }}>
      <div style={{ textAlign: "center", margin: 16 }}>
        <h1 className="text-style">Transpile and Bundle</h1>
        <h4 className="text-style">
          See transpiled and bundled JavaScript code here
        </h4>
        <textarea
          rows={20}
          placeholder="Enter your code here"
          className="textarea-style"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="btn-container">
        <button className="btn" onClick={onSubmitCode}>
          Submit
        </button>
      </div>
      <div>
        <pre style={{ color: "#fff", marginLeft: "5rem" }}>{codeOutput}</pre>
      </div>
    </div>
  );
};

export default App;
