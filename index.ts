import dotenv from "dotenv";
dotenv.config();

import { bootstrap } from "./src/bootstrap";
import { env } from "./src/entities/shared/infraestructure/config/environments";
import { appConsole } from "./src/entities/shared/infraestructure/utils/app-console";

(async () => {
  try {
    const app = await bootstrap();

    app.listen(env.app.port, () => {
      appConsole.log(`
╔═══════════════════════════════════════════════════════════╗
║                    BFF SERVICE STARTED                     ║
╠═══════════════════════════════════════════════════════════╣
║  Service:     ${String(env.app.name).padEnd(42)}║
║  Port:        ${String(env.app.port).padEnd(42)}║
║  Stage:       ${String(env.stage).padEnd(42)}║
║  Timestamp:   ${new Date().toISOString().padEnd(42)}║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    appConsole.error("Failed to start BFF service:", error);
    process.exit(1);
  }
})();
