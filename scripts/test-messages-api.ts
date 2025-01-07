import nodeFetch from "node-fetch";

// Use environment variables for the test user's session token
const TEST_AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;

if (!TEST_AUTH_TOKEN) {
  throw new Error(
    "TEST_AUTH_TOKEN is required. Please set it in your .env file"
  );
}

async function testMessagesAPI() {
  const channelId = "1"; // Using the first mock channel
  const baseUrl = "http://localhost:3000/api";

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
    };

    // Test GET messages
    console.log("\nTesting GET messages...");
    const getResponse = await nodeFetch(
      `${baseUrl}/channels/${channelId}/messages`,
      {
        headers,
      }
    );
    console.log("Status:", getResponse.status);
    if (getResponse.ok) {
      const messages = await getResponse.json();
      console.log("Messages:", messages);
    } else {
      console.log("Error:", await getResponse.text());
    }

    // Test POST message
    console.log("\nTesting POST message...");
    const postResponse = await nodeFetch(
      `${baseUrl}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: "Test message " + new Date().toISOString(),
        }),
      }
    );
    console.log("Status:", postResponse.status);
    if (postResponse.ok) {
      const newMessage = await postResponse.json();
      console.log("New Message:", newMessage);
    } else {
      console.log("Error:", await postResponse.text());
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testMessagesAPI();
