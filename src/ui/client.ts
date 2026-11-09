import { AegisError, type Reply, type Request, type ResponseMap } from "@/shared/messages";

export async function send<K extends Request["t"]>(
  req: Extract<Request, { t: K }>,
): Promise<ResponseMap[K]> {
  const reply = (await chrome.runtime.sendMessage(req)) as Reply<ResponseMap[K]> | undefined;
  if (!reply) throw new AegisError("internal");
  if (!reply.ok) throw new AegisError(reply.error.code);
  return reply.data;
}
