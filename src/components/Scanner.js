import { Component } from "react";
import PropTypes from "prop-types";
import Quagga from "@ericblade/quagga2";

function getMedian(arr) {
  arr.sort((a, b) => a - b);
  const half = Math.floor(arr.length / 2);
  if (arr.length % 2 === 1) {
    return arr[half];
  }
  return (arr[half - 1] + arr[half]) / 2;
}

function getMedianOfCodeErrors(decodedCodes) {
  const errors = decodedCodes
    .filter(x => x.error !== undefined)
    .map(x => x.error);
  const medianOfErrors = getMedian(errors);
  return medianOfErrors;
}

const defaultConstraints = {
  width: 1280, //640, 800, 1280 1600 1920,
  height: 720 //480   600   720 960 1080
};

const defaultLocatorSettings = {
  patchSize: "medium",
  halfSample: true
};

export class Scanner extends Component {
  static propTypes = {
    onDetected: PropTypes.func.isRequired,
    scannerRef: PropTypes.object.isRequired,
    onScannerReady: PropTypes.func,
    cameraId: PropTypes.string,
    facingMode: PropTypes.string,
    constraints: PropTypes.object,
    locator: PropTypes.object,
    numOfWorkers: PropTypes.number,
    decoders: PropTypes.array,
    locate: PropTypes.bool
  };
  static defaultProps = {
    constraints: defaultConstraints,
    locator: defaultLocatorSettings,
    numOfWorkers: navigator.hardwareConcurrency || 0,
    decoders: ["code_128_reader"],
    locate: true,
    frequency: 10
  };
  errorCheck = result => {
    const { onDetected } = this.props;
    if (!onDetected) {
      return;
    }
    const err = getMedianOfCodeErrors(result.codeResult.decodedCodes);
    console.log("on detected", result.codeResult, "error>>>", err);
    // if Quagga is at least 75% certain that it read correctly, then accept the code.
    if (err < 0.25) {
      onDetected(result);
    }
  };

  handleProcessed = result => {
    const drawingCtx = Quagga.canvas.ctx.overlay;
    const drawingCanvas = Quagga.canvas.dom.overlay;
    drawingCtx.font = "24px Arial";
    drawingCtx.fillStyle = "green";

    if (result) {
      // console.warn('* quagga onProcessed', result);
      if (result.boxes) {
        drawingCtx.clearRect(
          0,
          0,
          parseInt(drawingCanvas.getAttribute("width")),
          parseInt(drawingCanvas.getAttribute("height"))
        );
        result.boxes
          .filter(box => box !== result.box)
          .forEach(box => {
            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
              color: "purple",
              lineWidth: 2
            });
          });
      }
      if (result.box) {
        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
          color: "blue",
          lineWidth: 2
        });
      }
      if (result.codeResult && result.codeResult.code) {
        console.log("on processed", result.codeResult);
        // const validated = barcodeValidator(result.codeResult.code);
        // const validated = validateBarcode(result.codeResult.code);
        // Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: validated ? 'green' : 'red', lineWidth: 3 });
        // drawingCtx.font = "24px Arial";
        // drawingCtx.fillStyle = validated ? 'green' : 'red';
        // drawingCtx.fillText(`${result.codeResult.code} valid: ${validated}`, 10, 50);
        // drawingCtx.fillText(result.codeResult.code, 10, 20);
        // if (validated) {
        //     onDetected(result);
        // }
      }
    }
  };

  componentDidMount() {
    const {
      cameraId,
      facingMode,
      numOfWorkers,
      frequency,
      onScannerReady,
      scannerRef,
      constraints,
      locator,
      decoders,
      locate
    } = this.props;
    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          constraints: {
            ...constraints,
            ...(cameraId && { deviceId: cameraId }),
            ...(!cameraId && { facingMode }),
            aspectRatio: { min: 1, max: 100 }
          },
          target: scannerRef.current
        },
        locator,
        numOfWorkers,
        decoder: {
          readers: decoders,
          debug: {
            drawBoundingBox: true,
            showFrequency: true,
            drawScanline: true,
            showPattern: true
          }
        },
        frequency,
        locate
      },
      err => {
        Quagga.onProcessed(this.handleProcessed);

        if (err) {
          return console.log("Error starting Quagga:", err);
        }
        if (scannerRef && scannerRef.current) {
          Quagga.start();
          if (onScannerReady) {
            onScannerReady();
          }
        }
      }
    );
    Quagga.onDetected(this.errorCheck);
  }

  componentWillUnmount() {
    Quagga.offDetected(this.errorCheck);
    Quagga.offProcessed(this.handleProcessed);
    Quagga.stop();
  }

  render() {
    return null;
  }
}

export default Scanner;
