import OS from "../os";
import { requireChatGPTUser } from "../chatgpt-auth";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (
    ![
      "today",
      "goals",
      "work",
      "leetcode",
      "build",
      "fitness",
      "knowledge",
      "reviews",
      "backlog",
      "career",
    ].includes(view)
  )
    notFound();
  return <Protected view={view} />;
}
async function Protected({ view }: { view: string }) {
  await requireChatGPTUser("/" + view);
  return <OS />;
}
