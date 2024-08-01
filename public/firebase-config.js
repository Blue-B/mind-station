// Function to fetch Firebase config from the server
export async function getFirebaseConfig() {
  const response = await fetch('/firebase-config');
  if (!response.ok) {
    throw new Error('Failed to fetch Firebase config');
  }
  return response.json();
}
