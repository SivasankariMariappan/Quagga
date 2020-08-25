import React, { Component } from "react";
import Scanner from "./Scanner";
import Result from "./Result";
import { isMobile } from "react-device-detect";
import "./App.css";

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scanning: false,
      results: []
    };
    this.scannerRef = React.createRef();
  }

  setScanning = scanning => {
    this.setState({ scanning });
  };

  setResults = result => {
    this.setState({ results: [...this.state.results, result] });
  };
  render() {
    const { scanning, results } = this.state;
    return (
      <div>
        <button onClick={() => this.setScanning(!scanning)}>
          {scanning ? "Stop" : "Start"}
        </button>
        <ul className="results">
          {results.map(
            result =>
              result.codeResult && (
                <Result key={result.codeResult.code} result={result} />
              )
          )}
        </ul>

        <div
          id="interactive"
          class="viewport"
          ref={this.scannerRef}
          style={{
            position: "relative",
            border: "3px solid red",
            height: isMobile ? "100%" : "332px",
            width: isMobile ? "100%" : "545px"
          }}
        >
          <video
            autoplay="true"
            preload="auto"
            src=""
            muted="true"
            playsinline="true"
          ></video>
          {/* <video style={{ width: window.innerWidth, height: 480, border: '3px solid orange' }}/> */}
          <canvas
            className="drawingBuffer"
            style={{
              position: "absolute",
              top: "0px",
              // left: '0px',
              // height: '100%',
              // width: '100%',
              border: "3px solid green"
            }}
          />
          {scanning ? (
            <Scanner
              scannerRef={this.scannerRef}
              onDetected={result => this.setResults(result)}
            />
          ) : null}
        </div>
      </div>
    );
  }
}

export default App;
