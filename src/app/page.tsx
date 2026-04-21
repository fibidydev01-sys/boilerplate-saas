import { redirect } from "next/navigation";
import { createClient } from "@/core/lib/supabase/server";
import { appConfig } from "@/config";
import { ROUTES } from "@/core/constants";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  redirect(appConfig.auth.postLoginRedirect);
}
