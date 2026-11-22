// Prints a JS snippet that seeds localStorage with the demo session (for scripts/shot.mjs).
import { SEED_ORDERS, SEED_USER } from "../lib/data/seed.ts";
const state = { version: 1, cart: [], favorites: ["rechta-imperiale", "makrout-el-louz-dziriettes", "matlouh-agneau-confit"], users: [SEED_USER], sessionUserId: SEED_USER.id, orders: SEED_ORDERS };
process.stdout.write(`localStorage.setItem("ladentelle:v1", ${JSON.stringify(JSON.stringify(state))})`);
