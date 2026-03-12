import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRightLeft, Mic, Volume2, Loader2, Copy, Check } from "lucide-react";
import { languages } from "@/lib/mock-data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TranslatorPage = () => {
  const [fromLang, setFromLang] = useState("en");
  const [toLang, setToLang] = useState("es");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef<any>(null);

  const swapLangs = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const translate = async (text: string) => {
    if (!text.trim()) return;
    setIsTranslating(true);
    setOutputText("");

    try {
      const fromName = languages.find((l) => l.code === fromLang)?.name || fromLang;
      const toName = languages.find((l) => l.code === toLang)?.name || toLang;

      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { text, fromLang: fromName, toLang: toName },
      });

      if (error) throw error;
      if (data?.translatedText) {
        setOutputText(data.translatedText);
      } else {
        throw new Error("No translation returned");
      }
    } catch (err) {
      console.error("Translation error:", err);
      const targetName = languages.find((l) => l.code === toLang)?.name || toLang;
      setOutputText(`[${targetName} translation unavailable]`);
      toast.error("Translation failed. Please try again.");
    }

    setIsTranslating(false);
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = fromLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputText(transcript);
      translate(transcript);
    };
    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      setIsListening(false);
      if (e.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone permissions.");
      } else {
        toast.error(`Speech error: ${e.error}`);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const speak = (text: string, lang: string) => {
    if (!text) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const fromLangData = languages.find((l) => l.code === fromLang)!;
  const toLangData = languages.find((l) => l.code === toLang)!;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-display">Translator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Voice → Text → Translate → Speech
        </p>
      </div>

      {/* Language Selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <select
          value={fromLang}
          onChange={(e) => setFromLang(e.target.value)}
          className="flex-1 h-12 px-3 rounded-xl bg-card border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
          ))}
        </select>

        <button
          onClick={swapLangs}
          className="w-10 h-10 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-glow flex-shrink-0"
        >
          <ArrowRightLeft size={16} />
        </button>

        <select
          value={toLang}
          onChange={(e) => setToLang(e.target.value)}
          className="flex-1 h-12 px-3 rounded-xl bg-card border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
          ))}
        </select>
      </motion.div>

      {/* Input */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-4 py-2 border-b border-border flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{fromLangData.flag} {fromLangData.name}</span>
          <div className="flex gap-2">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isListening
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-muted text-muted-foreground"
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              <Mic size={14} />
            </button>
            {inputText && (
              <button
                onClick={() => speak(inputText, fromLang)}
                className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center"
                title="Listen to input"
              >
                <Volume2 size={14} />
              </button>
            )}
          </div>
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type or tap the mic to speak..."
          rows={4}
          className="w-full px-4 py-3 text-sm bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Translate Button */}
      <button
        onClick={() => translate(inputText)}
        disabled={!inputText.trim() || isTranslating}
        className="w-full h-12 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isTranslating ? <Loader2 size={18} className="animate-spin" /> : null}
        {isTranslating ? "Translating..." : "Translate"}
      </button>

      {/* Output */}
      {outputText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
        >
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{toLangData.flag} {toLangData.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => speak(outputText, toLang)}
                className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center"
                title="Listen to translation"
              >
                <Volume2 size={14} />
              </button>
              <button
                onClick={() => copyText(outputText)}
                className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center"
                title="Copy translation"
              >
                {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div className="px-4 py-3 text-sm min-h-[80px]">{outputText}</div>
        </motion.div>
      )}
    </div>
  );
};

export default TranslatorPage;
