const API_BASE_URL = 'http://localhost:4000';

export async function stuurPunte(punteData) {
  const response = await fetch(`${API_BASE_URL}/merk/punte`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(punteData)
  });

  if (!response.ok) {
    throw new Error("Kon nie punte stuur nie");
  }

  return await response.json();
}
