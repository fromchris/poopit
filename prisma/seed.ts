/**
 * Seed the database with demo creators and playables that match the original
 * mock data from the prototype. Re-run with `pnpm db:seed`; it clears and
 * re-writes (idempotent for dev).
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("→ clearing existing data");
  await db.$transaction([
    db.commentLike.deleteMany(),
    db.comment.deleteMany(),
    db.like.deleteMany(),
    db.follow.deleteMany(),
    db.notification.deleteMany(),
    db.playableTag.deleteMany(),
    db.tag.deleteMany(),
    db.playEvent.deleteMany(),
    db.playable.deleteMany(),
    db.generationJob.deleteMany(),
    db.session.deleteMany(),
    db.user.deleteMany(),
    db.rateLimitBucket.deleteMany(),
  ]);

  console.log("→ creating users");
  const password = await bcrypt.hash("looploop", 10);
  const users = await Promise.all(
    [
      { handle: "@you.loop", avatar: "🦄", bio: "prototype user · remixer · creator" },
      { handle: "@bubbly.lee", avatar: "🫧", bio: "ASMR fidget chef" },
      { handle: "@jellyking", avatar: "🟣", bio: "Jelly pet studio" },
      { handle: "@studio.loopit", avatar: "🎬", bio: "Official Loopit studio" },
      { handle: "@mia.makes", avatar: "🎨", bio: "color & chaos" },
      { handle: "@fidget.co", avatar: "⚙️", bio: "spinners, beads, bearings" },
    ].map((u) =>
      db.user.create({
        data: {
          handle: u.handle,
          handleLower: u.handle.toLowerCase(),
          avatar: u.avatar,
          bio: u.bio,
          passwordHash: password,
        },
      })
    )
  );

  const byHandle = Object.fromEntries(users.map((u) => [u.handle, u]));

  console.log("→ creating playables");
  const playables: Prisma.PlayableCreateInput[] = [
    {
      id: "drama-dqjtj-ep1",
      kind: "interactive-drama",
      bundleUrl: "/dramas/dqjtj-main.html",
      title: "大乾假太监 · EP01 主线",
      description: "宫廷权谋互动剧 · 你的每个选择都影响结局 🎬",
      theme: "from-stone-900 via-amber-950 to-black",
      creator: { connect: { id: byHandle["@studio.loopit"]!.id } },
      likeCount: 128400,
      commentCount: 3210,
      remixCount: 540,
      playCount: 5_600_000,
      tags: { create: tagsFor(["互动剧", "宫斗", "branching"]) },
    },
    {
      id: "p1",
      kind: "bubble-pop",
      title: "Infinite Bubble Pop",
      description: "tap the bubbles, chase the streak ✨",
      theme: "from-cyan-400 via-sky-500 to-indigo-600",
      creator: { connect: { id: byHandle["@bubbly.lee"]!.id } },
      likeCount: 24800, commentCount: 312, remixCount: 1400, playCount: 890000,
      tags: { create: tagsFor(["fidget", "asmr"]) },
    },
    {
      id: "p2",
      kind: "squishy-blob",
      title: "Squishy Jelly Pet",
      description: "press me, I bounce back 🫠",
      theme: "from-fuchsia-500 via-pink-500 to-rose-500",
      creator: { connect: { id: byHandle["@jellyking"]!.id } },
      likeCount: 52100, commentCount: 804, remixCount: 3200, playCount: 1_900_000,
      tags: { create: tagsFor(["asmr", "toy"]) },
    },
    {
      id: "p3",
      kind: "rhythm-tap",
      title: "Pigeon Rhythm",
      description: "tap to the beat, don't miss a coo 🐦",
      theme: "from-orange-400 via-amber-500 to-yellow-400",
      creator: { connect: { id: byHandle["@studio.loopit"]!.id } },
      likeCount: 98300, commentCount: 2100, remixCount: 8800, playCount: 4_200_000,
      tags: { create: tagsFor(["game", "rhythm", "template"]) },
    },
    {
      id: "p4",
      kind: "color-splat",
      title: "Paint the Void",
      description: "fling color, make a mess 🎨",
      theme: "from-emerald-500 via-teal-500 to-sky-500",
      creator: { connect: { id: byHandle["@mia.makes"]!.id } },
      likeCount: 14600, commentCount: 188, remixCount: 720, playCount: 430000,
      tags: { create: tagsFor(["art", "meme"]) },
    },
    {
      id: "p5",
      kind: "fidget-spinner",
      title: "Chrome Spinner",
      description: "flick to spin, spin forever 🌀",
      theme: "from-zinc-600 via-slate-800 to-black",
      creator: { connect: { id: byHandle["@fidget.co"]!.id } },
      likeCount: 37200, commentCount: 410, remixCount: 2600, playCount: 1_200_000,
      tags: { create: tagsFor(["fidget", "physics"]) },
    },
    {
      id: "p6",
      kind: "tap-rain",
      title: "Fruit Rain Snack",
      description: "catch the falling snacks before they drop 🍓",
      theme: "from-rose-400 via-pink-500 to-purple-600",
      creator: { connect: { id: byHandle["@mia.makes"]!.id } },
      likeCount: 21400, commentCount: 260, remixCount: 880, playCount: 680_000,
      tags: { create: tagsFor(["game", "tap"]) },
    },
    {
      id: "p7",
      kind: "match-pair",
      title: "Memory Bloom",
      description: "find the twin flowers before you lose the beat 🌸",
      theme: "from-indigo-600 via-violet-600 to-fuchsia-500",
      creator: { connect: { id: byHandle["@jellyking"]!.id } },
      likeCount: 18300, commentCount: 140, remixCount: 410, playCount: 390_000,
      tags: { create: tagsFor(["game", "puzzle"]) },
    },
    {
      id: "p8",
      kind: "draw-pad",
      title: "Midnight Doodle",
      description: "ink something weird. clear. repeat. ✏️",
      theme: "from-zinc-800 via-zinc-900 to-black",
      creator: { connect: { id: byHandle["@mia.makes"]!.id } },
      likeCount: 9400, commentCount: 96, remixCount: 210, playCount: 210_000,
      tags: { create: tagsFor(["art", "draw"]) },
    },
    {
      id: "p9",
      kind: "shake-mix",
      title: "Neon Cocktail Shaker",
      description: "shake your phone — watch the liquid change 🍸",
      theme: "from-amber-500 via-pink-500 to-violet-600",
      creator: { connect: { id: byHandle["@fidget.co"]!.id } },
      likeCount: 13600, commentCount: 112, remixCount: 540, playCount: 440_000,
      tags: { create: tagsFor(["fidget", "motion"]) },
    },
    {
      id: "p10",
      kind: "emoji-stamp",
      title: "Sticker Storm",
      description: "tap anywhere. stamp everywhere. 💖",
      theme: "from-pink-500 via-fuchsia-500 to-amber-400",
      creator: { connect: { id: byHandle["@bubbly.lee"]!.id } },
      likeCount: 28900, commentCount: 320, remixCount: 1200, playCount: 820_000,
      tags: { create: tagsFor(["meme", "stamp"]) },
    },
  ];

  for (const p of playables) {
    await db.playable.create({ data: p });
  }

  console.log("→ recomputing trending scores");
  await recomputeTrending();

  console.log("→ creating some comments");
  const comments: { playableId: string; handle: string; body: string }[] = [
    { playableId: "p1", handle: "@bubbly.lee", body: "i cannot stop popping these" },
    { playableId: "p2", handle: "@jellyking", body: "tysm for the love!! more coming ✨" },
    { playableId: "p3", handle: "@studio.loopit", body: "official template — remix away!" },
    { playableId: "p3", handle: "@fidget.co", body: "200 combo let's gooo" },
    { playableId: "p4", handle: "@mia.makes", body: "tip: flick your finger really fast" },
    { playableId: "p5", handle: "@fidget.co", body: "got 640 rpm, beat me" },
    { playableId: "drama-dqjtj-ep1", handle: "@bubbly.lee", body: "这个选择好难……第三遍看了才找到好结局" },
    { playableId: "drama-dqjtj-ep1", handle: "@mia.makes", body: "画面质感很上头！求第二集" },
  ];
  for (const c of comments) {
    await db.comment.create({
      data: {
        playableId: c.playableId,
        authorId: byHandle[c.handle]!.id,
        body: c.body,
      },
    });
  }

  console.log("→ seeding a few follows");
  await db.follow.createMany({
    data: [
      { followerId: byHandle["@you.loop"]!.id, followeeId: byHandle["@jellyking"]!.id },
      { followerId: byHandle["@you.loop"]!.id, followeeId: byHandle["@studio.loopit"]!.id },
      { followerId: byHandle["@jellyking"]!.id, followeeId: byHandle["@bubbly.lee"]!.id },
    ],
  });

  console.log("→ seeding notifications for @you.loop");
  await db.notification.createMany({
    data: [
      {
        recipientId: byHandle["@you.loop"]!.id,
        actorId: byHandle["@bubbly.lee"]!.id,
        type: "like", targetId: "p1", targetTitle: "Infinite Bubble Pop",
      },
      {
        recipientId: byHandle["@you.loop"]!.id,
        actorId: byHandle["@mia.makes"]!.id,
        type: "comment", targetId: "drama-dqjtj-ep1", targetTitle: "大乾假太监 · EP01",
        preview: "画面质感很上头！", read: false,
      },
      {
        recipientId: byHandle["@you.loop"]!.id,
        actorId: byHandle["@studio.loopit"]!.id,
        type: "follow", read: false,
      },
      {
        recipientId: byHandle["@you.loop"]!.id,
        type: "system",
        preview: "You unlocked the Remixer badge!",
        read: true,
      },
    ],
  });

  console.log("✓ seed complete");
  console.log(`   Demo login: handle=@you.loop password=looploop`);
}

function tagsFor(names: string[]) {
  return names.map((n) => ({
    tag: {
      connectOrCreate: {
        where: { name: n.toLowerCase() },
        create: { name: n.toLowerCase() },
      },
    },
  }));
}

async function recomputeTrending() {
  const pls = await db.playable.findMany();
  const now = Date.now();
  for (const p of pls) {
    const ageDays = (now - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const engagement = p.likeCount + p.commentCount * 4 + p.remixCount * 8;
    const score = Math.log1p(engagement) / Math.pow(ageDays + 2, 0.5);
    await db.playable.update({ where: { id: p.id }, data: { trendingScore: score } });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
