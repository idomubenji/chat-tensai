import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seedTestData() {
  try {
    // Clean up existing data
    console.log("Cleaning up existing data...");
    await db.channelMember.deleteMany({});
    await db.message.deleteMany({});
    await db.channel.deleteMany({});
    await db.user.deleteMany({});

    console.log("Creating new test data...");
    // Create a test user
    const user = await db.user.create({
      data: {
        id: "test_user_1",
        email: "test@example.com",
        name: "Test User",
        status: "ONLINE",
        role: "USER",
      },
    });

    // Create a test channel
    const channel = await db.channel.create({
      data: {
        id: "1",
        name: "general",
        description: "General discussion",
        createdById: user.id,
      },
    });

    // Add user as channel member
    await db.channelMember.create({
      data: {
        channelId: channel.id,
        userId: user.id,
        roleInChannel: "ADMIN",
      },
    });

    console.log("Test data seeded successfully!");
  } catch (error) {
    console.error("Error seeding test data:", error);
  } finally {
    await db.$disconnect();
  }
}

seedTestData();
