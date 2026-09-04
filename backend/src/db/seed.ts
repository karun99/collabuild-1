import { mockDb } from "./mock";
import { hashPassword } from "../utils/auth";

const seed = async () => {
  const password = await hashPassword("password123");

  const alice = mockDb.createUser("alice@collabuild.dev", "Alice", password);
  const bob = mockDb.createUser("bob@collabuild.dev", "Bob", password);

  const marketing = mockDb.createProject(
    "Marketing Landing Page",
    "Hero section exploration for the Q1 landing page.",
    "workspace-marketing",
    alice.id,
    false
  );

  const onboarding = mockDb.createProject(
    "Onboarding Flow",
    "Wireframe ideas for the new user onboarding.",
    "workspace-product",
    bob.id,
    true
  );

  mockDb.createDrawing(marketing.id, alice.id, {
    type: "rect",
    x: 120,
    y: 140,
    width: 240,
    height: 160,
    fill: "#6366f1",
    stroke: "#312e81",
    strokeWidth: 2,
    zIndex: 0,
  });

  mockDb.createDrawing(marketing.id, alice.id, {
    type: "circle",
    x: 480,
    y: 200,
    width: 140,
    height: 140,
    fill: "#ec4899",
    stroke: "#831843",
    strokeWidth: 2,
    zIndex: 1,
  });

  mockDb.createDrawing(marketing.id, bob.id, {
    type: "freehand",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fill: "transparent",
    stroke: "#10b981",
    strokeWidth: 2,
    zIndex: 2,
    data: {
      points: [
        { x: 700, y: 300 },
        { x: 720, y: 320 },
        { x: 750, y: 310 },
        { x: 770, y: 340 },
      ],
    },
  });

  mockDb.createDrawing(onboarding.id, bob.id, {
    type: "text",
    x: 200,
    y: 250,
    width: 300,
    height: 50,
    fill: "#0f172a",
    stroke: "#0f172a",
    strokeWidth: 1,
    zIndex: 0,
    data: { text: "Welcome to CollaBuild!" },
  });

  console.log("✅ Database seeded:");
  console.log(`   Users:    ${mockDb.users.size}`);
  console.log(`   Projects: ${mockDb.projects.size}`);
  console.log(`   Drawings: ${mockDb.drawings.size}`);
  console.log();
  console.log("   Login with: alice@collabuild.dev / password123");
};

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
