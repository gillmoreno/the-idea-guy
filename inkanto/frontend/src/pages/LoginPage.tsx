import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { t } from "../i18n";
import ThemeSwitcher from "../components/ThemeSwitcher";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register({ username, password, display_name: displayName || username, family_code: familyCode });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "errore");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="card w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">✨</div>
          <h1 className="text-4xl text-accent">Inkanto</h1>
          <p className="text-muted italic">{t("app_tag")}</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            className="input"
            placeholder={t("username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            required
          />
          <input
            className="input"
            type="password"
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === "register" && (
            <>
              <input
                className="input"
                placeholder={t("display_name")}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <input
                className="input"
                placeholder={t("family_code")}
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value)}
                required
              />
            </>
          )}
          {error && <p className="text-danger text-sm">{error}</p>}
          <button className="btn-spark w-full text-lg" disabled={busy}>
            {mode === "login" ? t("login") : t("register")}
          </button>
        </form>

        <button
          className="mt-6 w-full text-center text-link underline decoration-dotted"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? t("no_account") : t("have_account")}
        </button>

        <div className="mt-8 flex justify-center">
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
