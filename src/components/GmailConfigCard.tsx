import { GmailConfig } from "../lib/types";

type GmailConfigCardProps = {
  config: GmailConfig;
  loading: boolean;
  onChange: <K extends keyof GmailConfig>(key: K, value: GmailConfig[K]) => void;
  onTest: () => void;
  onSave: () => void;
  onSync: () => void;
};

export function GmailConfigCard(props: GmailConfigCardProps) {
  const { config } = props;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-coral">
            Configuracion Gmail
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Cuenta base del sistema</h2>
        </div>
        <div className="rounded-full bg-sand px-4 py-2 text-sm text-slate-600">
          solo usuario `ADMIN`
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral"
          value={config.baseEmail}
          placeholder="Correo base"
          onChange={(event) => props.onChange("baseEmail", event.target.value)}
        />
        <input
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral"
          value={config.appPassword ?? ""}
          type="password"
          placeholder="App Password de Gmail"
          onChange={(event) => props.onChange("appPassword", event.target.value)}
        />
        <input
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral"
          value={config.host}
          onChange={(event) => props.onChange("host", event.target.value)}
        />
        <input
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral"
          type="number"
          value={config.port}
          onChange={(event) => props.onChange("port", Number(event.target.value))}
        />
        <input
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral"
          type="number"
          value={config.spamScoreLimit}
          onChange={(event) => props.onChange("spamScoreLimit", Number(event.target.value))}
        />
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
          <input
            type="checkbox"
            checked={config.secure}
            onChange={(event) => props.onChange("secure", event.target.checked)}
          />
          Conexion segura TLS
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-full bg-teal px-5 py-3 font-semibold text-white disabled:opacity-50"
          disabled={props.loading}
          onClick={props.onTest}
        >
          Probar conexion
        </button>
        <button
          className="rounded-full bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50"
          disabled={props.loading}
          onClick={props.onSave}
        >
          Guardar base
        </button>
        <button
          className="rounded-full border border-ink px-5 py-3 font-semibold text-ink disabled:opacity-50"
          disabled={props.loading}
          onClick={props.onSync}
        >
          Sincronizar inbox
        </button>
      </div>
    </section>
  );
}
