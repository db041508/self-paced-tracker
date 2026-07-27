import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { VerticalTracker } from "@/components/VerticalTracker";

export const dynamic = "force-dynamic";

export default async function GridPage({
  params,
}: {
  params: Promise<{ blockId: string }>;
}) {
  const { blockId } = await params;
  const block = await prisma.block.findUnique({ where: { id: blockId } });
  if (!block) notFound();

  return (
    <div className="flex flex-1 flex-col bg-cream px-4 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="mb-3 inline-block text-sm text-ink-soft hover:underline"
        >
          ← All blocks
        </Link>
        <h1 className="mb-5 text-2xl font-bold text-ink">{block.name}</h1>
        <VerticalTracker blockId={blockId} />
      </div>
    </div>
  );
}
