import axios from "axios";
import "dotenv/config";

// --- Configuration ---
const API_BASE_URL = "https://rhid.com.br/v2";
const { EMAIL, PASSWORD } = process.env;

// --- API Service ---
const api = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Establishes a session and retrieves an access token.
 * @returns {Promise<string>} The access token.
 */
async function getSessionToken() {
  try {
    console.log("Attempting to get session token...");
    await api.get("/#/login");

    const payload = {
      domain: null,
      email: EMAIL,
      password: PASSWORD,
    };

    const response = await api.post("/login.svc/", payload);
    const { accessToken } = response.data;

    if (!accessToken) {
      throw new Error("Access token not found in response.");
    }

    console.log("Successfully retrieved session token.");
    return accessToken;
  } catch (error) {
    console.error("Error getting session token:", error.message);
    throw error; // Re-throw to stop execution
  }
}

/**
 * Generates the unlock code.
 * @param {string} token - The authorization token.
 * @param {string} serial - The equipment serial number.
 * @param {string} senha - The equipment password.
 * @returns {Promise<any>} The unlock code data.
 */
async function getUnlockCode(token, serial, senha) {
  try {
    console.log("Attempting to get unlock code...");
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // TODO: De que forma receber serial e senha? Para automatizar provavelmente linha de comando
    const response = await api.get(
      `/util.svc/desbloqueio_rep_violacao/?serial=${serial}&senha=${senha}`
    );

    console.log("Successfully retrieved unlock code:");
    // TODO: Pegar case de ja desbloqueado, bloqueado, não bloqueado. Tratar result.
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error getting unlock code:", error.message);
    throw error; // Re-throw to stop execution
  }
}

// --- Main Execution ---
async function main() {
  try {
    const token = await getSessionToken();

    const args = process.argv.slice(2);
    const serialArg = args.find((arg) => arg.startsWith("--serial="));
    const senhaArg = args.find((arg) => arg.startsWith("--senha="));

    if (!serialArg || !senhaArg) {
      console.error(
        'Usage: node scrapper.js --serial=<serial> --senha=<senha>'
      );
      process.exit(1);
    }

    const serial = serialArg.split("=")[1];
    const senha = senhaArg.split("=")[1];

    if (!serial || !senha) {
      console.error(
        'Usage: node scrapper.js --serial=<serial> --senha=<senha>'
      );
      process.exit(1);
    }

    await getUnlockCode(token, serial, senha);
    console.log("\nScript finished successfully!");
  } catch (error) {
    console.error("\nScript failed to complete.");
    process.exit(1); // Exit with an error code
  }
}

main();
