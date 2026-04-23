/**
 * Background job runner. Given a `GenerationJob`, runs the chosen agent
 * to completion, auto-publishes the resulting Playable, and pushes a
 * `generation_ready` notification so the user can be pinged from anywhere
 * in the app — even if they closed the tab mid-generation.
 *
 * The runner is invoked from route handlers as a fire-and-forget promise.
 * For single-node self-hosted deploys this is fine; on serverless you'd
 * wrap this in `waitUntil()` or push to a real queue (BullMQ/SQS/…).
 */
import { prisma } from "@/app/server/db";
import { logger } from "@/app/server/logger";
import { runGenerateAgent } from "./generate";
import { generateBundle, type Attachment } from "./codeMode";
import type { PlayableSpec } from "./tools";

export type RunnerInput = {
  jobId: string;
  userId: string;
  prompt: string;
  mode: "parameter" | "code";
  source?: PlayableSpec | null;
  attachments?: Attachment[];
};

export async function runJobInBackground(input: RunnerInput): Promise<void> {
  const { jobId, userId, prompt, mode, source, attachments } = input;
  const steps: string[] = [];
  try {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "running", mode },
    });

    let spec: PlayableSpec | null = null;
    let bundleUrl: string | null = null;

    // Progress updater: persist current steps list to DB so pollers see it live.
    const tickStep = async (s: string) => {
      steps.push(s);
      await prisma.generationJob
        .update({
          where: { id: jobId },
          data: { steps: JSON.stringify(steps) },
        })
        .catch(() => {});
    };

    if (mode === "code") {
      await tickStep("Analyzing prompt");
      await tickStep("Writing playable code");
      const res = await generateBundle({
        prompt,
        sourceDescription: source?.description,
        attachments,
      });
      if (!res.ok) throw new Error(`code-mode: ${res.reason}`);
      await tickStep("Sandbox check");
      spec = {
        kind: "llm-bundle",
        theme: source?.theme ?? "from-purple-600 via-fuchsia-500 to-amber-400",
        title: prompt.slice(0, 60).trim() || "Untitled playable",
        description: prompt.slice(0, 140).trim() || "ai generated",
        tags: ["ai", "code"],
      };
      bundleUrl = res.bundleUrl;
    } else {
      for await (const evt of runGenerateAgent({ prompt, source })) {
        if (evt.type === "step") await tickStep(evt.step);
        else if (evt.type === "spec") spec = evt.spec;
      }
      if (!spec) throw new Error("agent produced no spec");
    }

    // Persist as a real Playable (auto-publish).
    const created = await prisma.playable.create({
      data: {
        kind: spec.kind,
        title: spec.title,
        description: spec.description,
        theme: spec.theme,
        bundleUrl: bundleUrl ?? undefined,
        creatorId: userId,
        sourceId: (source as PlayableSpec & { id?: string })?.id ?? null,
        tags: {
          create: (spec.tags ?? []).map((name) => ({
            tag: {
              connectOrCreate: {
                where: { name: name.toLowerCase() },
                create: { name: name.toLowerCase() },
              },
            },
          })),
        },
      },
    });

    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: "succeeded",
        playableId: created.id,
        steps: JSON.stringify(steps),
        completedAt: new Date(),
      },
    });

    // Notify self so the card surfaces in the user's Inbox.
    await prisma.notification.create({
      data: {
        recipientId: userId,
        type: "generation_ready",
        targetId: created.id,
        targetTitle: spec.title,
        preview: spec.description.slice(0, 140),
      },
    });

    logger.info(
      { jobId, playableId: created.id, mode, steps: steps.length },
      "generation succeeded"
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "generation failed";
    logger.error({ err, jobId }, "generation failed");
    await prisma.generationJob
      .update({
        where: { id: jobId },
        data: {
          status: "failed",
          errorCode: message.slice(0, 100),
          steps: JSON.stringify(steps),
          completedAt: new Date(),
        },
      })
      .catch(() => {});
    await prisma.notification
      .create({
        data: {
          recipientId: userId,
          type: "generation_failed",
          targetTitle: prompt.slice(0, 60),
          preview: message.slice(0, 140),
        },
      })
      .catch(() => {});
  }
}
