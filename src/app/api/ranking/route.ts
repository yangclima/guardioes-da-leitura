import { ok, serverError } from "@/lib/http";
import { loadGeneralRanking } from "@/lib/queries";

export async function GET() {
  try {
    return ok(await loadGeneralRanking());
  } catch (error) {
    return serverError("general ranking", error);
  }
}
