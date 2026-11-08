// Tennis Tracker — ostatnia siatka bezpieczeństwa: uszkodzony rekord albo błąd
// w widoku nie zostawia białego ekranu, tylko pokazuje komunikat i przycisk
// ponownego uruchomienia. Dane meczów zostają w pamięci urządzenia.
import { Component } from "react";
import { translate, getStoredLang } from "./i18n.js";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("Tennis Tracker error", error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const lang = getStoredLang() || "pl";
    return (
      <div role="alert" style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 14, padding: 24, textAlign: "center", background: "#0b1020", color: "#f2f4ff", fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{translate(lang, "error.title")}</div>
        <div style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.45, opacity: 0.8 }}>{translate(lang, "error.hint")}</div>
        <button onClick={() => window.location.reload()} style={{
          minHeight: 48, padding: "0 28px", borderRadius: 999, border: "none", background: "#ff8a1a", color: "#1b1200",
          fontSize: 16, fontWeight: 700, cursor: "pointer",
        }}>{translate(lang, "error.reload")}</button>
      </div>
    );
  }
}
