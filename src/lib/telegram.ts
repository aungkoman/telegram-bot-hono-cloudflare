const API_BASE = "https://api.telegram.org/bot";

export function tgClient(token: string) {
  const base = `${API_BASE}${token}`;

  async function call<T = unknown>(method: string, payload: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${base}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Telegram API error on ${method}: ${res.status} ${body}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    sendMessage(chatId: number | string, text: string, extra: Record<string, unknown> = {}) {
      return call("sendMessage", {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...extra,
      });
    },
    setWebhook(url: string, secretToken: string) {
      return call("setWebhook", { url, secret_token: secretToken });
    },
    deleteWebhook() {
      return call("deleteWebhook", {});
    },
  };
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
