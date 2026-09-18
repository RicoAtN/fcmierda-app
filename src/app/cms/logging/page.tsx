import { redirect } from "next/navigation";

export default function LoggingRedirectPage() {
  redirect("/cms/analytics");
}
