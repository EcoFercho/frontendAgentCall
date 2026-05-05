import { useEffect, useRef, useState } from "react";
import { CalendarDaysIcon, ChevronDownIcon, MailIcon, Settings2Icon, ShieldCheckIcon, Trash2Icon, UploadIcon } from "lucide-react";
import * as XLSX from "xlsx";
import { AppSidebar, PanelSection } from "./components/app-sidebar";
import { SiteHeader } from "./components/site-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./components/ui/sheet";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import { LoginForm } from "./features/auth/components/LoginForm";
import { getCurrentAdmin, loginAdmin } from "./features/auth/api/auth.api";
import { SectionCards } from "./features/dashboard/components/SectionCards";
import { TickerBoard } from "./features/dashboard/components/TickerBoard";
import { useTicker } from "./features/dashboard/hooks/useTicker";
import { defaultGmailConfig } from "./features/gmail-config/lib/default-gmail-config";
import {
  getClassifiedMessages,
  getMessageSummary,
  getMailConfig,
  saveMailConfig,
  syncMailbox,
  testMailConnection
} from "./features/mail/api/mail.api";
import {
  createShiftUser,
  deleteShiftUser,
  listShiftUsers,
  updateShiftUser
} from "./features/shift-users/api/shift-users.api";
import { createEmptyShiftUserForm, emptyShiftUserForm } from "./features/shift-users/lib/empty-shift-user-form";
import {
  formatShiftDate,
  getTodayDateValue,
  isShiftUserAvailable,
  normalizeShiftUsers,
  schedulesOverlap,
  toMinutes
} from "./features/shift-users/lib/schedule";
import { GmailConfig, ShiftUser } from "./shared/types";
import { toast } from "sonner";

type FlashTone = "neutral" | "success" | "error";
type ShiftUserFormState = typeof emptyShiftUserForm;
type ShiftUsersView = "form" | "list";

const TOKEN_STORAGE_KEY = "voice-app.token";
const EMAIL_STORAGE_KEY = "voice-app.email";

export function App() {
  const [email, setEmail] = useState("engine.ia.lab@gmail.com");
  const [password, setPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [token, setToken] = useState("");
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [backgroundSyncing, setBackgroundSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [activeSection, setActiveSection] = useState<PanelSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [messageSummaryCount, setMessageSummaryCount] = useState(0);
  const [config, setConfig] = useState<GmailConfig>(defaultGmailConfig);
  const [flash, setFlash] = useState("Inicia sesión para entrar al panel.");
  const [flashTone, setFlashTone] = useState<FlashTone>("neutral");
  const [shiftUsers, setShiftUsers] = useState<ShiftUser[]>([]);
  const [shiftUserForm, setShiftUserForm] = useState<ShiftUserFormState>(() =>
    createEmptyShiftUserForm(getTodayDateValue())
  );
  const [shiftUsersView, setShiftUsersView] = useState<ShiftUsersView>("form");
  const [importingShifts, setImportingShifts] = useState(false);
  const syncInFlightRef = useRef(false);
  const dashboardRefreshInFlightRef = useRef(false);
  const shiftImportInputRef = useRef<HTMLInputElement | null>(null);
  const { messages, setMessages, isConnected } = useTicker([]);

  const todayDateValue = getTodayDateValue();
  const orderedShiftUsers = normalizeShiftUsers(shiftUsers);
  const availableShiftUsers = orderedShiftUsers.filter((user) => isShiftUserAvailable(user));
  const shiftUsersForSelectedDate = shiftUserForm.shiftDate
    ? orderedShiftUsers.filter((user) => user.shiftDate === shiftUserForm.shiftDate)
    : [];
  const shiftUserGroups = [...orderedShiftUsers]
    .sort((left, right) => right.shiftDate.localeCompare(left.shiftDate) || toMinutes(left.shiftStart) - toMinutes(right.shiftStart))
    .reduce<Array<{ shiftDate: string; users: ShiftUser[] }>>((groups, user) => {
    const currentGroup = groups[groups.length - 1];

    if (!currentGroup || currentGroup.shiftDate !== user.shiftDate) {
      groups.push({ shiftDate: user.shiftDate, users: [user] });
      return groups;
    }

    currentGroup.users.push(user);
    return groups;
  }, []);

  function setFlashMessage(message: string, tone: FlashTone = "neutral") {
    setFlash(message);
    setFlashTone(tone);

    if (tone === "success") {
      toast.success(message);
    }

    if (tone === "error") {
      toast.error(message);
    }
  }

  function persistSession(nextToken: string, nextEmail: string) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    window.localStorage.setItem(EMAIL_STORAGE_KEY, nextEmail);
  }

  function clearPersistedSession() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);
  }

  function clearSessionState(message = "Tu sesión expiró. Vuelve a iniciar sesión.") {
    clearPersistedSession();
    setToken("");
    setSessionEmail("");
    setPassword("");
    setMessages([]);
    setShiftUsers([]);
    setLastSyncedAt(null);
    setMessageSummaryCount(0);
    setConfig(defaultGmailConfig);
    setShiftUserForm(createEmptyShiftUserForm(getTodayDateValue()));
    setShiftUsersView("form");
    setActiveSection("dashboard");
    setSidebarCollapsed(false);
    setMobileSidebarOpen(false);
    setFlashMessage(message, "error");
  }

  async function loadInitialData(authToken: string, options?: { includeShiftUsers?: boolean }) {
    const includeShiftUsers = options?.includeShiftUsers ?? true;
    const [savedConfig, approvedMessages, messageSummary, savedShiftUsers] = await Promise.all([
      getMailConfig(authToken),
      getClassifiedMessages(authToken),
      getMessageSummary(authToken),
      includeShiftUsers ? listShiftUsers(authToken) : Promise.resolve(null)
    ]);

    setMessages(approvedMessages);
    setMessageSummaryCount(messageSummary.classifiedCount);
    if (savedShiftUsers) {
      setShiftUsers(savedShiftUsers);
    }

    if (savedConfig) {
      setConfig({
        ...savedConfig,
        appPassword: ""
      });
      setLastSyncedAt(savedConfig.lastSyncAt ?? null);
    } else {
      setConfig(defaultGmailConfig);
      setLastSyncedAt(null);
    }
  }

  async function restoreSession(savedToken: string, savedEmail: string) {
    try {
      const currentUser = await getCurrentAdmin(savedToken);
      setToken(savedToken);
      setSessionEmail(currentUser.email);
      setEmail(currentUser.email || savedEmail);
      await loadInitialData(savedToken);
      setFlashMessage(`Sesión restaurada para ${currentUser.email}.`, "success");
    } catch {
      clearSessionState();
    } finally {
      setBooting(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    try {
      const response = await loginAdmin(email, password);
      persistSession(response.accessToken, response.user.email);
      setToken(response.accessToken);
      setSessionEmail(response.user.email);
      setEmail(response.user.email);
      await loadInitialData(response.accessToken);
      setFlashMessage(`Sesión iniciada para ${response.user.email}.`, "success");
    } catch (error) {
      setFlashMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión", "error");
    } finally {
      setLoading(false);
      setBooting(false);
    }
  }

  function handleLogout() {
    clearPersistedSession();
    setToken("");
    setSessionEmail("");
    setPassword("");
    setMessages([]);
    setShiftUsers([]);
    setLastSyncedAt(null);
    setMessageSummaryCount(0);
    setConfig(defaultGmailConfig);
    setShiftUserForm(createEmptyShiftUserForm(getTodayDateValue()));
    setShiftUsersView("form");
    setActiveSection("dashboard");
    setSidebarCollapsed(false);
    setMobileSidebarOpen(false);
    setFlashMessage("Sesión cerrada.", "neutral");
  }

  async function handleSync(options?: { silent?: boolean; background?: boolean }) {
    if (!token || syncInFlightRef.current) {
      return;
    }

    syncInFlightRef.current = true;
    if (options?.background) {
      setBackgroundSyncing(true);
    } else {
      setSyncing(true);
    }

    try {
      const response = await syncMailbox(token);
      await loadInitialData(token, { includeShiftUsers: false });
      setLastSyncedAt(new Date().toISOString());

      if (!options?.silent) {
        setFlashMessage(
          `Sincronización completada. Revisados: ${response.synced}, relevantes: ${response.approved}, no relevantes: ${response.irrelevant}, spam: ${response.spam}.`,
          "success"
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo sincronizar";
      if (message.includes("401")) {
        clearSessionState();
        return;
      }

      if (!options?.silent) {
        setFlashMessage(message, "error");
      }
    } finally {
      syncInFlightRef.current = false;
      if (options?.background) {
        setBackgroundSyncing(false);
      } else {
        setSyncing(false);
      }
    }
  }

  async function refreshDashboardData(authToken: string, options?: { background?: boolean }) {
    if (dashboardRefreshInFlightRef.current) {
      return;
    }

    dashboardRefreshInFlightRef.current = true;
    if (options?.background) {
      setBackgroundSyncing(true);
    }

    try {
      await loadInitialData(authToken, { includeShiftUsers: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar el panel";
      if (message.includes("401")) {
        clearSessionState();
      }
    } finally {
      dashboardRefreshInFlightRef.current = false;
      if (options?.background) {
        setBackgroundSyncing(false);
      }
    }
  }

  async function handleTestConnection() {
    setLoading(true);
    try {
      const response = await testMailConnection(
        {
          baseEmail: config.baseEmail,
          appPassword: config.appPassword,
          host: config.host,
          port: config.port,
          secure: config.secure
        },
        token
      );
      setFlashMessage(response.message, "success");
    } catch (error) {
      setFlashMessage(error instanceof Error ? error.message : "Falló la prueba de conexión", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveConfig() {
    setLoading(true);
    try {
      const savedConfig = await saveMailConfig(config, token);
      setConfig({
        ...savedConfig,
        appPassword: ""
      });
      setFlashMessage("Configuración guardada.", "success");
    } catch (error) {
      setFlashMessage(error instanceof Error ? error.message : "No se pudo guardar la configuración", "error");
    } finally {
      setLoading(false);
    }
  }

  function resetShiftUserForm() {
    setShiftUserForm(createEmptyShiftUserForm(todayDateValue));
    setShiftUsersView("form");
  }

  async function handleShiftExcelImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!token) {
      setFlashMessage("Inicia sesión para importar turnos.", "error");
      return;
    }

    setImportingShifts(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("El archivo Excel no tiene hojas para importar.");
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const matrix = XLSX.utils.sheet_to_json<(string | number | Date)[]>(worksheet, {
        header: 1,
        raw: true,
        defval: ""
      });

      if (!matrix.length) {
        throw new Error("El archivo Excel no contiene filas de horarios.");
      }

      const rows = parseShiftImportRows(matrix);

      if (!rows.length) {
        throw new Error("El archivo Excel no contiene filas de horarios válidas.");
      }

      const payloads = rows.map((row, index) => {
        const normalized = normalizeImportRow(row);
        const firstName = getStringCell(normalized.nombre);
        const lastName = getStringCell(normalized.apellido);
        const phone = getStringCell(normalized.celular);
        const shiftDate = parseExcelDateValue(normalized.fecha);
        const shiftStart = parseExcelTimeValue(normalized.horainicio);
        const shiftEnd = parseExcelTimeValue(normalized.horafin);
        const isMaster = parseMasterValue(normalized.master);

        if (!firstName || !lastName || !phone || !shiftDate || !shiftStart || !shiftEnd) {
          throw new Error(`La fila ${index + 2} no tiene el formato esperado.`);
        }

        return {
          firstName,
          lastName,
          phone,
          shiftDate,
          shiftStart,
          shiftEnd,
          isMaster
        };
      });

      for (const payload of payloads) {
        await createShiftUser(payload, token);
      }

      const users = await listShiftUsers(token);
      setShiftUsers(users);
      setFlashMessage(`Se importaron ${payloads.length} turno${payloads.length === 1 ? "" : "s"} desde Excel.`, "success");
    } catch (error) {
      setFlashMessage(error instanceof Error ? error.message : "No se pudo importar el archivo Excel.", "error");
    } finally {
      setImportingShifts(false);
    }
  }

  async function handleShiftUserSubmit() {
    const firstName = shiftUserForm.firstName.trim();
    const lastName = shiftUserForm.lastName.trim();
    const phone = shiftUserForm.phone.trim();

    if (!firstName || !lastName || !phone) {
      setFlashMessage("Completa nombre, apellido y celular.", "error");
      return;
    }

    if (!shiftUserForm.shiftDate) {
      setFlashMessage("Selecciona una fecha.", "error");
      return;
    }

    if (shiftUserForm.shiftDate < todayDateValue) {
      setFlashMessage("No se pueden registrar turnos para fechas pasadas.", "error");
      return;
    }

    if (toMinutes(shiftUserForm.shiftStart) >= toMinutes(shiftUserForm.shiftEnd)) {
      setFlashMessage("La hora de fin debe ser mayor a la hora de inicio.", "error");
      return;
    }

    const conflictingUser = shiftUsersForSelectedDate.find((user) => {
      if (shiftUserForm.id && user.id === shiftUserForm.id) {
        return false;
      }

      return schedulesOverlap(
        shiftUserForm.shiftStart,
        shiftUserForm.shiftEnd,
        user.shiftStart,
        user.shiftEnd
      );
    });

    if (conflictingUser) {
      setFlashMessage(
        `Ese horario se cruza con ${conflictingUser.firstName} ${conflictingUser.lastName}.`,
        "error"
      );
      return;
    }

    try {
      const payload = {
        firstName,
        lastName,
        phone,
        shiftDate: shiftUserForm.shiftDate,
        shiftStart: shiftUserForm.shiftStart,
        shiftEnd: shiftUserForm.shiftEnd,
        isMaster: shiftUserForm.isMaster
      };

      if (shiftUserForm.id) {
        await updateShiftUser(shiftUserForm.id, payload, token);
      } else {
        await createShiftUser(payload, token);
      }

      const users = await listShiftUsers(token);
      setShiftUsers(users);
      resetShiftUserForm();
      setFlashMessage("Turno guardado correctamente.", "success");
    } catch (error) {
      setFlashMessage(error instanceof Error ? error.message : "No se pudo guardar el turno", "error");
    }
  }

  function handleShiftUserEdit(user: ShiftUser) {
    setShiftUserForm({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      shiftDate: user.shiftDate,
      shiftStart: user.shiftStart,
      shiftEnd: user.shiftEnd,
      isMaster: user.isMaster
    });
    setShiftUsersView("form");
    setActiveSection("shift-users");
  }

  async function handleShiftUserDelete(userId: string) {
    if (!window.confirm("¿Eliminar este turno?")) {
      return;
    }

    try {
      await deleteShiftUser(userId, token);
      const users = await listShiftUsers(token);
      setShiftUsers(users);

      if (shiftUserForm.id === userId) {
        resetShiftUserForm();
      }

      setFlashMessage("Turno eliminado.", "success");
    } catch (error) {
      setFlashMessage(error instanceof Error ? error.message : "No se pudo eliminar el turno", "error");
    }
  }

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    const savedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY) ?? "engine.ia.lab@gmail.com";
    setEmail(savedEmail);

    if (!savedToken) {
      setBooting(false);
      return;
    }

    void restoreSession(savedToken, savedEmail);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    void handleSync({ silent: true, background: true });
  }, [token]);

  useEffect(() => {
    if (!token || !autoSyncEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void handleSync({ silent: true, background: true });
    }, 30000);

    const handleFocus = () => {
      void handleSync({ silent: true, background: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [token, autoSyncEnabled]);

  function renderFlash() {
    const toneClass =
      flashTone === "success"
        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
        : flashTone === "error"
          ? "border-orange-400/25 bg-orange-400/10 text-orange-100"
          : "border-white/10 bg-white/6 text-white/72";

    return <div className={`rounded-xl border px-4 py-3 text-sm ${toneClass}`}>{flash}</div>;
  }

  function renderGmailView() {
    return (
      <Card className="dashboard-metric-card text-white">
        <CardHeader>
          <CardTitle className="text-white">Configuración Gmail</CardTitle>
          <CardDescription className="text-white/44">
            Mantengo el panel y dejé este formulario claro para editar host, password y reglas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Correo base" id="baseEmail">
              <Input
                id="baseEmail"
                className="dashboard-dark-input"
                value={config.baseEmail}
                onChange={(event) => setConfig((current) => ({ ...current, baseEmail: event.target.value }))}
              />
            </Field>
            <Field label="App Password" id="appPassword">
              <Input
                id="appPassword"
                className="dashboard-dark-input"
                type="password"
                value={config.appPassword ?? ""}
                onChange={(event) => setConfig((current) => ({ ...current, appPassword: event.target.value }))}
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Field label="Host IMAP" id="host">
                <Input
                  id="host"
                  className="dashboard-dark-input"
                  value={config.host}
                  onChange={(event) => setConfig((current) => ({ ...current, host: event.target.value }))}
                />
              </Field>
            </div>
            <Field label="Puerto" id="port">
              <Input
                id="port"
                className="dashboard-dark-input"
                type="number"
                value={config.port}
                onChange={(event) =>
                  setConfig((current) => ({ ...current, port: Number(event.target.value) || 0 }))
                }
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Límite anti-spam" id="spamScoreLimit">
              <Input
                id="spamScoreLimit"
                className="dashboard-dark-input"
                type="number"
                value={config.spamScoreLimit}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    spamScoreLimit: Number(event.target.value) || 0
                  }))
                }
              />
            </Field>
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white">
              <span>TLS activo</span>
              <Switch
                checked={config.secure}
                onCheckedChange={(checked) => setConfig((current) => ({ ...current, secure: checked }))}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="bg-[#ff845d] text-black hover:bg-[#ff9b7b]" onClick={handleSaveConfig} disabled={loading}>
              Guardar configuración
            </Button>
            <Button
              variant="outline"
              className="border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white"
              onClick={handleTestConnection}
              disabled={loading}
            >
              Probar conexión
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderShiftView() {
    return (
      <div className="grid gap-6">
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={() => setShiftUsersView("form")}
            className={[
              "rounded-xl px-4 py-2.5 text-sm font-medium transition",
              shiftUsersView === "form"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-white/72 hover:bg-white/8 hover:text-white"
            ].join(" ")}
          >
            Registrar turno
          </button>
          <button
            type="button"
            onClick={() => setShiftUsersView("list")}
            className={[
              "rounded-xl px-4 py-2.5 text-sm font-medium transition",
              shiftUsersView === "list"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-white/72 hover:bg-white/8 hover:text-white"
            ].join(" ")}
          >
            Ver lista
          </button>
        </div>
        {shiftUsersView === "form" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="dashboard-metric-card text-white">
          <CardHeader>
            <CardTitle className="text-white">{shiftUserForm.id ? "Editar turno" : "Registrar turno"}</CardTitle>
            <CardDescription className="text-white/44">
              Formulario rápido para cargar turnos sin solapamientos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre" id="shift-firstName">
                <Input
                  id="shift-firstName"
                  className="dashboard-dark-input"
                  value={shiftUserForm.firstName}
                  onChange={(event) =>
                    setShiftUserForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                />
              </Field>
              <Field label="Apellido" id="shift-lastName">
                <Input
                  id="shift-lastName"
                  className="dashboard-dark-input"
                  value={shiftUserForm.lastName}
                  onChange={(event) =>
                    setShiftUserForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Celular" id="shift-phone">
                <Input
                  id="shift-phone"
                  className="dashboard-dark-input"
                  value={shiftUserForm.phone}
                  onChange={(event) =>
                    setShiftUserForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </Field>
              <Field label="Fecha" id="shift-date">
                <Input
                  id="shift-date"
                  className="dashboard-dark-input"
                  type="date"
                  min={todayDateValue}
                  value={shiftUserForm.shiftDate}
                  onChange={(event) =>
                    setShiftUserForm((current) => ({ ...current, shiftDate: event.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hora inicio" id="shift-start">
                <Input
                  id="shift-start"
                  className="dashboard-dark-input"
                  type="time"
                  value={shiftUserForm.shiftStart}
                  onChange={(event) =>
                    setShiftUserForm((current) => ({ ...current, shiftStart: event.target.value }))
                  }
                />
              </Field>
              <Field label="Hora fin" id="shift-end">
                <Input
                  id="shift-end"
                  className="dashboard-dark-input"
                  type="time"
                  value={shiftUserForm.shiftEnd}
                  onChange={(event) =>
                    setShiftUserForm((current) => ({ ...current, shiftEnd: event.target.value }))
                  }
                />
              </Field>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white">
              <Checkbox
                checked={shiftUserForm.isMaster}
                onCheckedChange={(checked) =>
                  setShiftUserForm((current) => ({ ...current, isMaster: checked === true }))
                }
              />
              <span>Usuario master</span>
            </label>

            <div className="flex flex-wrap gap-3">
              <Button className="bg-[#ff845d] text-black hover:bg-[#ff9b7b]" onClick={handleShiftUserSubmit}>
                {shiftUserForm.id ? "Actualizar turno" : "Registrar turno"}
              </Button>
              <Button
                variant="outline"
                className="border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white"
                onClick={() => shiftImportInputRef.current?.click()}
                disabled={importingShifts}
              >
                <UploadIcon className="size-4" />
                {importingShifts ? "Importando..." : "Cargar Excel"}
              </Button>
              <Button
                variant="outline"
                className="border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white"
                onClick={resetShiftUserForm}
              >
                Limpiar
              </Button>
              <input
                ref={shiftImportInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => void handleShiftExcelImport(event)}
              />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6">
          <Card className="dashboard-metric-card text-white">
            <CardHeader>
              <CardTitle className="text-white">Disponibilidad vigente</CardTitle>
              <CardDescription className="text-white/44">
                Turnos registrados para la fecha seleccionada.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {shiftUserForm.shiftDate ? (
                shiftUsersForSelectedDate.length ? (
                shiftUsersForSelectedDate.map((user) => (
                  <div key={`available-${user.id}`} className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                    <p className="font-medium text-emerald-100">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-emerald-200/80">
                      {formatShiftDate(user.shiftDate)} Â· {user.shiftStart} - {user.shiftEnd}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/55">
                  No hay turnos registrados para esa fecha.
                </div>
                )
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/55">
                  Selecciona una fecha para ver los turnos registrados.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-metric-card text-white">
            <CardHeader>
              <CardTitle className="text-white">Turnos registrados</CardTitle>
              <CardDescription className="text-white/44">
                Agrupados por fecha para revisar todos los turnos registrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {shiftUserForm.shiftDate ? (
                shiftUsersForSelectedDate.length ? (
                shiftUsersForSelectedDate.map((user) => (
                  <div key={user.id} className="grid gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.isMaster ? (
                          <Badge variant="outline" className="border-sky-400/20 bg-sky-400/10 text-sky-200">
                            Master
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-white/55">{user.phone}</p>
                      <p className="mt-1 text-sm text-white/65">
                        {formatShiftDate(user.shiftDate)} Â· {user.shiftStart} - {user.shiftEnd}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => handleShiftUserEdit(user)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-400/20 bg-red-400/10 text-red-100 hover:bg-red-400/20 hover:text-red-50"
                        onClick={() => void handleShiftUserDelete(user.id)}
                      >
                        <Trash2Icon className="size-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/55">
                  No hay turnos registrados para esa fecha.
                </div>
                )
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/55">
                  Selecciona una fecha para ver los turnos registrados.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
        ) : null}

        {shiftUsersView === "list" ? (
        <div className="grid gap-6">
          <Card className="dashboard-metric-card text-white">
            <CardHeader>
              <CardTitle className="text-white">Disponibilidad vigente</CardTitle>
              <CardDescription className="text-white/44">
                Usuarios con turno activo en este momento.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {availableShiftUsers.length ? (
                availableShiftUsers.map((user) => (
                  <div key={`available-${user.id}`} className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                    <p className="font-medium text-emerald-100">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-emerald-200/80">
                      {formatShiftDate(user.shiftDate)} · {user.shiftStart} - {user.shiftEnd}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/55">
                  No hay turnos activos ahora mismo.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-metric-card text-white">
            <CardHeader>
              <CardTitle className="text-white">Turnos registrados</CardTitle>
              <CardDescription className="text-white/44">
                Agrupados por fecha para revisar todos los turnos registrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {shiftUserGroups.length ? (
                shiftUserGroups.map((group) => (
                  <details key={group.shiftDate} className="group rounded-2xl border border-white/10 bg-white/5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:hidden">
                      <div>
                        <p className="font-semibold text-white">{formatShiftDate(group.shiftDate)}</p>
                        <p className="mt-1 text-sm text-white/55">
                          {group.users.length} turno{group.users.length === 1 ? "" : "s"} registrado{group.users.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <ChevronDownIcon className="size-5 text-white/60 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="grid gap-3 border-t border-white/8 px-4 py-4">
                      {group.users.map((user) => (
                  <div key={user.id} className="grid gap-3 rounded-xl border border-white/10 bg-[#0f1720]/70 px-4 py-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.isMaster ? (
                          <Badge variant="outline" className="border-sky-400/20 bg-sky-400/10 text-sky-200">
                            Master
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-white/55">{user.phone}</p>
                      <p className="mt-1 text-sm text-white/65">
                        {formatShiftDate(user.shiftDate)} · {user.shiftStart} - {user.shiftEnd}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => handleShiftUserEdit(user)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-400/20 bg-red-400/10 text-red-100 hover:bg-red-400/20 hover:text-red-50"
                        onClick={() => void handleShiftUserDelete(user.id)}
                      >
                        <Trash2Icon className="size-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                      ))}
                    </div>
                  </details>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/55">
                  No hay turnos registrados.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        ) : null}
      </div>
    );
  }

  if (booting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Restaurando sesión...
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#2a2a2a] px-6 py-10">
        <div className="w-full max-w-md">
          <LoginForm
            email={email}
            password={password}
            loading={loading}
            flash={flash}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.08),_transparent_22%),linear-gradient(180deg,_#090d12_0%,_#0f141b_50%,_#121924_100%)] text-white">
      <div className="lg:flex lg:min-h-screen">
        <AppSidebar
          className="hidden lg:flex lg:flex-col"
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          userEmail={sessionEmail || email}
          isLive={isConnected}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
          onLogout={handleLogout}
        />

        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent
            side="left"
            className="w-[320px] border-r border-white/10 bg-transparent p-0 text-white sm:max-w-none"
            showCloseButton={false}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navegación</SheetTitle>
              <SheetDescription>Panel lateral del sistema</SheetDescription>
            </SheetHeader>
            <AppSidebar
              className="flex h-full w-full flex-col border-r-0"
              activeSection={activeSection}
              onSectionChange={(section) => {
                setActiveSection(section);
                setMobileSidebarOpen(false);
              }}
              userEmail={sessionEmail || email}
              isLive={isConnected}
              collapsed={false}
              onToggleCollapsed={() => setMobileSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <SiteHeader
            title={
              activeSection === "dashboard"
                ? "Panel de correos aprobados"
                : activeSection === "config"
                  ? "Ajustes de Gmail"
                  : "Gestión de usuarios de turno"
            }
            visibleCount={activeSection === "shift-users" ? orderedShiftUsers.length : messageSummaryCount}
            isLive={isConnected}
            autoSyncEnabled={autoSyncEnabled}
            syncing={syncing}
            backgroundSyncing={backgroundSyncing}
            showSyncControls={activeSection !== "shift-users"}
            visibleLabel={activeSection === "shift-users" ? "turnos" : "clasificados"}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            onToggleAutoSync={() => setAutoSyncEnabled((current) => !current)}
            onSync={() => void handleSync()}
          />

          <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            {activeSection === "dashboard" ? (
              <>
                <SectionCards
                  visibleCount={messageSummaryCount}
                  isLive={isConnected}
                  autoSyncEnabled={autoSyncEnabled}
                  lastSyncedAt={lastSyncedAt}
                />
                <div className="px-4 lg:px-6">
                  <TickerBoard
                    messages={messages}
                    isLive={isConnected}
                    isSyncing={syncing || backgroundSyncing}
                    autoSyncEnabled={autoSyncEnabled}
                    lastSyncedAt={lastSyncedAt}
                    onSync={() => void handleSync()}
                    onToggleAutoSync={() => setAutoSyncEnabled((current) => !current)}
                  />
                </div>
              </>
            ) : activeSection === "config" ? (
              <div className="px-4 lg:px-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
                  <div>{renderGmailView()}</div>
                  <div className="grid gap-6 self-start">
                    <Card className="dashboard-metric-card py-0 text-white">
                      <CardHeader className="space-y-2 px-6 py-6">
                        <CardDescription className="text-white/44">Cuenta base</CardDescription>
                        <CardTitle className="break-all text-[2rem] font-semibold leading-tight text-white">
                          {config.baseEmail || "--"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 pt-0 text-sm text-white/82">
                        <p className="font-medium text-white">Canal principal de lectura</p>
                        <p className="mt-2 text-white/58">Inbox y Spam segun la configuracion del backend</p>
                      </CardContent>
                    </Card>

                    <Card className="dashboard-metric-card py-0 text-white">
                      <CardHeader className="space-y-2 px-6 py-6">
                        <CardDescription className="text-white/44">Seguridad</CardDescription>
                        <CardTitle className="text-[2rem] font-semibold leading-tight text-white">
                          {config.secure ? "TLS habilitado" : "TLS desactivado"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 pt-0 text-sm text-white/82">
                        <p className="font-medium text-white">Host {config.host || "--"}</p>
                        <p className="mt-2 text-white/58">Puerto {config.port || "--"}</p>
                      </CardContent>
                    </Card>

                    <Card className="dashboard-metric-card py-0 text-white">
                      <CardHeader className="space-y-2 px-6 py-6">
                        <CardDescription className="text-white/44">Auto-sync</CardDescription>
                        <CardTitle className="text-[2rem] font-semibold leading-tight text-white">
                          {autoSyncEnabled ? "Encendido" : "Apagado"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 pt-0 text-sm text-white/82">
                        <p className="font-medium text-white">Ultimo sync</p>
                        <p className="mt-2 text-white/58">
                          {lastSyncedAt
                            ? new Intl.DateTimeFormat("es-BO", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              }).format(new Date(lastSyncedAt))
                            : "Sin actividad reciente"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 lg:px-6">{renderShiftView()}</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field(props: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="text-white/85">
        {props.label}
      </Label>
      {props.children}
    </div>
  );
}

function normalizeImportRow(row: Record<string, unknown>) {
  return Object.entries(row).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    const normalizedKey = key
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();

    accumulator[normalizedKey] = value;
    return accumulator;
  }, {});
}

function parseShiftImportRows(matrix: Array<Array<string | number | Date>>) {
  const normalizedRows = matrix.map((row) => row.map((cell) => (typeof cell === "string" ? cell.trim() : cell)));
  const nonEmptyRows = normalizedRows.filter((row) => row.some((cell) => getStringCell(cell) !== ""));

  if (!nonEmptyRows.length) {
    return [];
  }

  const firstRow = nonEmptyRows[0];
  if (firstRow.length > 1) {
    const [headerRow, ...dataRows] = nonEmptyRows;
    return dataRows.map((row) =>
      headerRow.reduce<Record<string, unknown>>((record, header, index) => {
        record[String(header)] = row[index] ?? "";
        return record;
      }, {})
    );
  }

  const verticalHeaders = nonEmptyRows.slice(0, 7).map((row) => getStringCell(row[0]));
  const expectedHeaders = ["Nombre", "apellido", "Celular", "Fecha", "hora inicio", "hora fin", "master"];

  const isVerticalFormat = expectedHeaders.every(
    (header, index) => verticalHeaders[index]?.toLowerCase() === header.toLowerCase()
  );

  if (!isVerticalFormat) {
    return [];
  }

  const valueRows = normalizedRows.slice(7);
  const records: Array<Record<string, unknown>> = [];

  let index = 0;
  while (index < valueRows.length) {
    while (index < valueRows.length && getStringCell(valueRows[index]?.[0]) === "") {
      index += 1;
    }

    if (index >= valueRows.length) {
      break;
    }

    const block = valueRows.slice(index, index + 6);
    if (block.length < 6 || block.some((row) => getStringCell(row?.[0]) === "")) {
      break;
    }

    let master = "";
    const nextValue = getStringCell(valueRows[index + 6]?.[0]);
    if (nextValue.toLowerCase() === "si") {
      master = nextValue;
      index += 1;
    }

    records.push({
      Nombre: block[0]?.[0] ?? "",
      apellido: block[1]?.[0] ?? "",
      Celular: block[2]?.[0] ?? "",
      Fecha: block[3]?.[0] ?? "",
      "hora inicio": block[4]?.[0] ?? "",
      "hora fin": block[5]?.[0] ?? "",
      master
    });

    index += 6;
  }

  return records;
}

function getStringCell(value: unknown) {
  return String(value ?? "").trim();
}

function parseMasterValue(value: unknown) {
  return getStringCell(value).toLowerCase() === "si";
}

function parseExcelDateValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalDateValue(value);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.format("yyyy-mm-dd", value);
    return /^\d{4}-\d{2}-\d{2}$/.test(parsed) ? parsed : "";
  }

  const normalized = getStringCell(value);
  if (!normalized) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function parseExcelTimeValue(value: unknown) {
  if (typeof value === "number") {
    const parsed = XLSX.SSF.format("hh:mm", value);
    return /^\d{2}:\d{2}$/.test(parsed) ? parsed : "";
  }

  const normalized = getStringCell(value);
  if (!normalized) {
    return "";
  }

  const timeMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) {
    return "";
  }

  const [, hours, minutes] = timeMatch;
  return `${hours.padStart(2, "0")}:${minutes}`;
}

function formatLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}
