import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { t } from "../i18n";
import ThemeSwitcher from "../components/ThemeSwitcher";

// floating decorations: [glyph, top%, left%, size rem, accent|pop]
const SPARKS: [string, string, string, number, "accent" | "pop"][] = [
  ["✦", "12%", "14%", 1.1, "accent"],
  ["✶", "20%", "78%", 0.9, "pop"],
  ["✧", "34%", "6%", 0.8, "pop"],
  ["✦", "55%", "90%", 1.2, "accent"],
  ["✶", "74%", "12%", 1.0, "accent"],
  ["✧", "84%", "70%", 0.9, "pop"],
  ["✦", "8%", "52%", 0.7, "pop"],
];

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username, password);
    } catch {
      setError(t("login_wrong"));
      setShakeKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-scene min-h-dvh grid place-items-center p-6">
      {SPARKS.map(([glyph, top, left, size, tone], i) => (
        <span
          key={i}
          aria-hidden
          className="login-spark"
          style={{
            top,
            left,
            color: `var(--${tone})`,
            ["--spark-size" as string]: `${size}rem`,
            ["--spark-i" as string]: i,
          }}
        >
          {glyph}
        </span>
      ))}

      <div
        key={shakeKey}
        className={`login-card card w-full max-w-sm p-8 ${shakeKey ? "shake" : "pop-in"}`}
      >
        <div className="text-center mb-8">
          <div className="login-quill text-5xl mb-3" aria-hidden>🪶</div>
          <h1 className="rise-in text-5xl font-bold text-accent" style={{ ["--rise-delay" as string]: "80ms" }}>
            Inkanto
          </h1>
          <p className="rise-in text-muted italic mt-1" style={{ ["--rise-delay" as string]: "160ms" }}>
            {t("app_tag")}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="rise-in" style={{ ["--rise-delay" as string]: "240ms" }}>
            <label className="login-input-label" htmlFor="login-user">{t("username")}</label>
            <input
              id="login-user"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div className="rise-in" style={{ ["--rise-delay" as string]: "320ms" }}>
            <label className="login-input-label" htmlFor="login-pass">{t("password")}</label>
            <input
              id="login-pass"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-danger text-sm text-center" role="alert">
              {error}
            </p>
          )}

          <button
            className="rise-in btn-spark w-full text-lg py-3"
            style={{ ["--rise-delay" as string]: "400ms" }}
            disabled={busy}
          >
            {busy ? "…" : `${t("login")} ✨`}
          </button>
        </form>

        <div className="rise-in mt-8 flex justify-center" style={{ ["--rise-delay" as string]: "480ms" }}>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
