import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Volume2, Clock, Ticket, Info, X, ExternalLink, ScanLine } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QRResult {
  name: string;
  history: string;
  culturalSignificance: string;
  entryFee: string;
  hours: string;
  image: string;
}

const monumentDatabase: Record<string, QRResult> = {
  gateway_of_india: {
    name: "Gateway of India",
    history: "Built between 1911 and 1924, the Gateway of India was erected to commemorate the landing of King George V and Queen Mary at Apollo Bunder. The arch is built in the Indo-Saracenic style.",
    culturalSignificance: "The Gateway is considered the Taj Mahal of Mumbai and is the city's top tourist attraction.",
    entryFee: "Free",
    hours: "Open 24 hours",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&h=400&fit=crop",
  },
  taj_mahal: {
    name: "Taj Mahal",
    history: "Commissioned in 1632 by Mughal emperor Shah Jahan to house the tomb of his favourite wife, Mumtaz Mahal. Constructed over 20 years by 20,000 artisans.",
    culturalSignificance: "A UNESCO World Heritage Site and one of the New Seven Wonders of the World.",
    entryFee: "₹50 (Indians), ₹1,100 (Foreigners)",
    hours: "6:00 AM - 6:30 PM (Closed Fridays)",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&h=400&fit=crop",
  },
  elephanta_caves: {
    name: "Elephanta Caves",
    history: "Dating back to the 5th-8th centuries, these rock-cut cave temples are dedicated to Lord Shiva. UNESCO World Heritage Site since 1987.",
    culturalSignificance: "Contains remarkable sculptures including the famous Trimurti (three-faced Shiva) standing 6 meters tall.",
    entryFee: "₹40 (Indians), ₹600 (Foreigners)",
    hours: "9:30 AM - 5:30 PM (Closed Mondays)",
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=400&fit=crop",
  },
  red_fort: {
    name: "Red Fort",
    history: "Built in 1639 by Mughal Emperor Shah Jahan as the palace of his fortified capital Shahjahanabad. A UNESCO World Heritage Site.",
    culturalSignificance: "The Prime Minister hoists the Indian national flag here every Independence Day. Symbol of India's sovereignty.",
    entryFee: "₹35 (Indians), ₹500 (Foreigners)",
    hours: "9:30 AM - 4:30 PM (Closed Mondays)",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&h=400&fit=crop",
  },
  qutub_minar: {
    name: "Qutub Minar",
    history: "A 73-metre tall minaret built in 1193 by Qutb-ud-din Aibak. It is the tallest brick minaret in the world.",
    culturalSignificance: "UNESCO World Heritage Site and a fine example of Indo-Islamic Afghan architecture.",
    entryFee: "₹35 (Indians), ₹550 (Foreigners)",
    hours: "7:00 AM - 5:00 PM",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=400&fit=crop",
  },
};

type ScanStatus = "idle" | "scanning" | "detected" | "opening";

const QRScannerPage = () => {
  const [result, setResult] = useState<QRResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scannedText, setScannedText] = useState<string | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasDetectedRef = useRef(false);
  const scannerContainerId = "qr-reader";

  const isUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleScanSuccess = useCallback((text: string) => {
    // Prevent duplicate detections
    if (hasDetectedRef.current) return;
    hasDetectedRef.current = true;

    setScannedText(text);

    if (isUrl(text)) {
      setScanStatus("opening");
      setScannedUrl(text);
      setTimeout(() => window.open(text, "_blank", "noopener,noreferrer"), 1500);
      return;
    }

    const key = text.toLowerCase().replace(/\s+/g, "_").trim();
    const found = monumentDatabase[key];
    if (found) {
      setResult(found);
    } else {
      setResult({
        name: "Scanned Information",
        history: text,
        culturalSignificance: "This QR code contained plain text. It did not match a known monument in our database.",
        entryFee: "N/A",
        hours: "N/A",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      });
    }
  }, []);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // Html5QrcodeScannerState.SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Stop scanner error:", e);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    // Clean up any previous instance
    await stopScanning();
    
    setCameraError(null);
    hasDetectedRef.current = false;
    setScanning(true);
    setScanStatus("scanning");

    // Small delay to ensure the container div is rendered and visible
    await new Promise((r) => setTimeout(r, 100));

    try {
      const scanner = new Html5Qrcode(scannerContainerId, {
        verbose: false,
        formatsToSupport: undefined, // scan all formats
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          disableFlip: false,
        },
        (decodedText) => {
          setScanStatus("detected");
          handleScanSuccess(decodedText);
          // Stop after successful detection
          stopScanning();
        },
        () => {
          // Ignore scan failures (no QR found in frame) — continuous scanning
        }
      );
    } catch (err: any) {
      console.error("Camera error:", err);
      const message =
        typeof err === "string"
          ? err
          : err?.message?.includes("Permission")
          ? "Camera permission denied. Please enable camera access in your browser settings and try again."
          : "Camera access denied or unavailable. Please check your browser settings or try the demo buttons below.";
      setCameraError(message);
      setScanning(false);
      setScanStatus("idle");
    }
  }, [stopScanning, handleScanSuccess]);

  const simulateScan = (key: string) => {
    setScanStatus("detected");
    handleScanSuccess(key);
  };

  const speak = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en";
    speechSynthesis.speak(utterance);
  };

  const resetScanner = () => {
    stopScanning();
    hasDetectedRef.current = false;
    setResult(null);
    setScannedText(null);
    setScannedUrl(null);
    setCameraError(null);
    setScanStatus("idle");
  };

  // Auto-start scanning when page loads
  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusMessage: Record<ScanStatus, string> = {
    idle: "📷 Point the camera at a QR code",
    scanning: "📷 Scanning... Point camera at a QR code",
    detected: "✅ QR code detected!",
    opening: "🔗 Opening link...",
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-display">QR Scanner</h1>
        <p className="text-sm text-muted-foreground mt-1">Scan monument QR codes for instant info</p>
      </div>

      {!result && !scannedUrl ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
          {/* Scanner container — always rendered so html5-qrcode can attach */}
          <div className="w-72 h-72 rounded-3xl border-2 border-primary/30 bg-black overflow-hidden relative">
            <div id={scannerContainerId} className="w-full h-full" />
            
            {/* Scanning frame overlay */}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[200px] h-[200px] relative">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                  {/* Animated scan line */}
                  <motion.div
                    className="absolute left-2 right-2 h-0.5 bg-primary/80"
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            )}

            {/* Placeholder when not scanning */}
            {!scanning && scanStatus === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                <div className="text-center space-y-3">
                  <Camera size={48} className="mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Initializing camera...</p>
                </div>
              </div>
            )}
          </div>

          {/* Status message */}
          <p className={`mt-3 text-xs font-medium text-center ${
            scanStatus === "detected" ? "text-green-500" : "text-primary"
          }`}>
            {statusMessage[scanStatus]}
          </p>

          {cameraError && (
            <div className="mt-3 text-xs text-destructive text-center max-w-[280px] space-y-2">
              <p>{cameraError}</p>
              <button
                onClick={startScanning}
                className="text-primary underline font-medium"
              >
                Try again
              </button>
            </div>
          )}

          <div className="mt-6 w-full space-y-3">
            {scanning ? (
              <button
                onClick={() => { stopScanning(); setScanStatus("idle"); }}
                className="w-full h-14 rounded-2xl bg-destructive text-destructive-foreground font-semibold flex items-center justify-center gap-2"
              >
                <X size={20} /> Stop Scanning
              </button>
            ) : (
              <button
                onClick={startScanning}
                className="w-full h-14 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold shadow-glow flex items-center justify-center gap-2"
              >
                <Camera size={20} /> Open Camera & Scan
              </button>
            )}

            <p className="text-xs text-muted-foreground text-center">Or try a demo:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(monumentDatabase).slice(0, 4).map(([key, mon]) => (
                <button
                  key={key}
                  onClick={() => { stopScanning(); simulateScan(key); }}
                  className="h-10 rounded-xl bg-card border border-border text-foreground font-medium text-xs flex items-center justify-center gap-1.5"
                >
                  🏛️ {mon.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      ) : scannedUrl ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
          <ExternalLink size={48} className="mx-auto text-primary" />
          <h2 className="text-lg font-bold font-display">Opening Link</h2>
          <p className="text-sm text-muted-foreground break-all">{scannedUrl}</p>
          <a
            href={scannedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-hero text-primary-foreground font-medium shadow-glow"
          >
            <ExternalLink size={16} /> Open Link
          </a>
          <button onClick={resetScanner} className="block w-full text-sm text-primary font-medium mt-4">
            ← Scan another code
          </button>
        </motion.div>
      ) : result ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <img src={result.image} alt={result.name} className="w-full h-48 object-cover rounded-2xl" />

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">{result.name}</h2>
            <button
              onClick={() => speak(`${result.name}. ${result.history}`)}
              className="w-10 h-10 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-glow"
            >
              <Volume2 size={18} />
            </button>
          </div>

          {scannedText && (
            <p className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-lg">
              Scanned: {scannedText}
            </p>
          )}

          <div className="flex gap-3">
            <div className="flex-1 bg-card rounded-xl p-3 shadow-card border border-border text-center">
              <Ticket size={16} className="mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Entry Fee</p>
              <p className="text-sm font-semibold">{result.entryFee}</p>
            </div>
            <div className="flex-1 bg-card rounded-xl p-3 shadow-card border border-border text-center">
              <Clock size={16} className="mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Hours</p>
              <p className="text-sm font-semibold">{result.hours}</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
            <h3 className="font-semibold font-display flex items-center gap-1.5 mb-2">
              <Info size={14} className="text-primary" /> Historical Information
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.history}</p>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
            <h3 className="font-semibold font-display mb-2">Cultural Significance</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.culturalSignificance}</p>
          </div>

          <button onClick={resetScanner} className="w-full text-sm text-primary font-medium">
            ← Scan another code
          </button>
        </motion.div>
      ) : null}
    </div>
  );
};

export default QRScannerPage;
