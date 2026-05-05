import { useState } from "react";
import { MailOpen, Sparkles } from "lucide-react";
import { ApprovedMessage } from "../lib/types";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "./ui/dialog";

type TickerBoardProps = {
  messages: ApprovedMessage[];
  isLive: boolean;
  isSyncing: boolean;
  autoSyncEnabled: boolean;
  lastSyncedAt: string | null;
  onSync: () => void;
  onToggleAutoSync: () => void;
};

function formatReceivedAt(value: string) {
  const dateParts = new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short"
  }).formatToParts(new Date(value));

  const day = dateParts.find((part) => part.type === "day")?.value ?? "";
  const month = dateParts.find((part) => part.type === "month")?.value.replace(".", "").toLowerCase() ?? "";

  const timeLabel = new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));

  return `Recibido: ${day}-${month}, ${timeLabel}`;
}

function getStatusLabel(status: ApprovedMessage["status"]) {
  switch (status) {
    case "APPROVED":
      return "Relevante";
    case "IRRELEVANT":
      return "No relevante";
    case "SPAM":
      return "Spam";
    default:
      return "Recibido";
  }
}

function getStatusClasses(status: ApprovedMessage["status"]) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
    case "IRRELEVANT":
      return "border-amber-300/20 bg-amber-300/10 text-amber-100";
    case "SPAM":
      return "border-orange-400/20 bg-orange-400/10 text-orange-100";
    default:
      return "border-white/12 bg-white/6 text-white/70";
  }
}

function formatEmailBody(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getEmailPreview(message: ApprovedMessage) {
  const content = formatEmailBody(message.bodyText || message.snippet || "");
  if (!content) {
    return "Sin contenido disponible.";
  }

  return content.length > 180 ? `${content.slice(0, 180).trim()}...` : content;
}

export function TickerBoard(props: TickerBoardProps) {
  const { messages } = props;
  const [activeView, setActiveView] = useState<"all" | "approved">("approved");
  const [selectedMessage, setSelectedMessage] = useState<ApprovedMessage | null>(null);
  const visibleMessages =
    activeView === "approved"
      ? messages.filter((message) => message.status === "APPROVED")
      : messages;
  const latestMessage = visibleMessages[0];

  const hasVisibleMessages = visibleMessages.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-start px-1">
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={() => setActiveView("all")}
            className={[
              "rounded-xl px-4 py-2.5 text-sm font-medium transition",
              activeView === "all"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-white/72 hover:bg-white/8 hover:text-white"
            ].join(" ")}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setActiveView("approved")}
            className={[
              "rounded-xl px-4 py-2.5 text-sm font-medium transition",
              activeView === "approved"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-white/72 hover:bg-white/8 hover:text-white"
            ].join(" ")}
          >
            Relevantes
          </button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.45fr)] 2xl:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.6fr)]">
        {renderContent(visibleMessages, latestMessage, hasVisibleMessages, selectedMessage, setSelectedMessage)}
      </div>
    </div>
  );
}

function renderContent(
  visibleMessages: ApprovedMessage[],
  latestMessage: ApprovedMessage | undefined,
  hasVisibleMessages: boolean,
  selectedMessage: ApprovedMessage | null,
  setSelectedMessage: (message: ApprovedMessage | null) => void
) {
  return (
    <>
      <Card className="min-w-0 self-start border-white/10 bg-[linear-gradient(180deg,_rgba(16,16,16,0.94),_rgba(18,18,18,0.92))] py-0 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <CardHeader className="border-b border-white/8 px-6 py-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-white/12 bg-white/8 text-white/72">
                <Sparkles className="mr-1 size-3" />
                Correo mas reciente
              </Badge>
              {latestMessage ? (
                <>
                  <Badge variant="outline" className={getStatusClasses(latestMessage.status)}>
                    {getStatusLabel(latestMessage.status)}
                  </Badge>
                  <Badge variant="outline" className="border-white/12 bg-white/6 text-white/70">
                    {formatReceivedAt(latestMessage.receivedAt)}
                  </Badge>
                </>
              ) : null}
            </div>

            <div className="min-w-0">
              <CardTitle className="max-w-[22ch] text-balance break-words text-[1.65rem] font-semibold leading-[1.15] text-white md:text-[1.9rem] xl:text-[2.05rem]">
                {latestMessage?.subject || "Sin correos para esta vista"}
              </CardTitle>
              {latestMessage ? (
                <CardDescription className="mt-4 break-all text-sm leading-6 text-white/56 md:text-[0.95rem]">
                  {latestMessage.fromName || latestMessage.fromEmail}
                </CardDescription>
              ) : (
                <CardDescription className="mt-4 text-sm leading-6 text-white/56 md:text-[0.95rem]">
                  No hay correos que coincidan con el filtro actual.
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-6 py-6">
          <div className="grid gap-4">
            <div className="grid gap-4">
              {latestMessage ? (
                <>
                  <div className="min-w-0 rounded-[1.5rem] border border-white/8 bg-white/[0.045] p-5">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/34">Remitente</p>
                    <p className="mt-3 break-words text-lg font-semibold leading-7 text-white">
                      {latestMessage.fromName || latestMessage.fromEmail}
                    </p>
                    {latestMessage.fromName ? (
                      <p className="mt-2 break-all text-sm leading-6 text-white/45">{latestMessage.fromEmail}</p>
                    ) : null}
                    {latestMessage.detectedClientName ? (
                      <p className="mt-4 inline-flex rounded-full border border-[#59e1cf]/20 bg-[#59e1cf]/10 px-3 py-1 text-sm text-[#8ef2e4]">
                        Cliente detectado: {latestMessage.detectedClientName}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.045] p-5">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/34">Confianza</p>
                    <p className="mt-3 text-3xl font-semibold leading-none text-white">
                      {latestMessage.classificationConfidence ?? 0}
                      <span className="ml-1 text-base text-white/48">%</span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/52">
                  No hay correos disponibles en esta vista.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 xl:sticky xl:top-4">
        <Card className="border-white/10 bg-[linear-gradient(180deg,_rgba(16,16,16,0.94),_rgba(18,18,18,0.92))] py-0 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
          <CardHeader className="border-b border-white/8 px-5 py-5">
            <div>
              <CardTitle className="text-white">Cola clasificada</CardTitle>
              <CardDescription className="text-white/44">
                {hasVisibleMessages
                  ? `${visibleMessages.length} correos visibles en esta vista`
                  : "No hay correos visibles en esta vista"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-5 py-5">
            <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
              {hasVisibleMessages ? (
                visibleMessages.map((message) => (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => setSelectedMessage(message)}
                    className="block w-full rounded-[1.6rem] border border-white/8 bg-white/5 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#59e1cf]/35 hover:bg-[#1a242d] hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)] focus:outline-none focus:ring-2 focus:ring-[#59e1cf]/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {message.fromName || message.fromEmail}
                        </p>
                        <p className="mt-1 truncate text-sm text-white/48">
                          {message.subject || "(sin asunto)"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <p className="text-xs text-white/38">
                          {formatReceivedAt(message.receivedAt)}
                        </p>
                        <Badge variant="outline" className={getStatusClasses(message.status)}>
                          {getStatusLabel(message.status)}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/50">
                      {getEmailPreview(message)}
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/52">
                  No hay correos para mostrar en esta vista.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selectedMessage)} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selectedMessage ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMessage.subject || "(sin asunto)"}</DialogTitle>
                <DialogDescription>
                  {selectedMessage.fromName || selectedMessage.fromEmail}
                  {selectedMessage.fromName ? ` - ${selectedMessage.fromEmail}` : ""}
                  {` - ${formatReceivedAt(selectedMessage.receivedAt)}`}
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="overflow-y-auto">
                <div className="grid gap-4">
                  <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.045] p-5">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/34">Remitente</p>
                    <p className="mt-3 break-words text-base font-semibold leading-7 text-white">
                      {selectedMessage.fromName || selectedMessage.fromEmail}
                    </p>
                    {selectedMessage.fromName ? (
                      <p className="mt-2 break-all text-sm leading-6 text-white/48">{selectedMessage.fromEmail}</p>
                    ) : null}
                    {selectedMessage.detectedClientName ? (
                      <p className="mt-4 inline-flex rounded-full border border-[#59e1cf]/20 bg-[#59e1cf]/10 px-3 py-1 text-sm text-[#8ef2e4]">
                        Cliente: {selectedMessage.detectedClientName}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.045] p-5">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/36">
                      <MailOpen className="size-3.5" />
                      Correo recibido
                    </p>
                    <div className="mt-4 rounded-[1.25rem] border border-white/8 bg-[#0b1118] px-4 py-4 whitespace-pre-wrap text-sm leading-7 text-white/82">
                      {formatEmailBody(
                        selectedMessage.bodyText || selectedMessage.snippet || "Sin contenido disponible para este correo."
                      )}
                    </div>
                  </div>
                </div>
              </DialogBody>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
