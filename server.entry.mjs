import { serve } from "h3-v2";
import server from "./dist/server/server.js";

const port = Number(process.env.PORT) || 3000;

serve(server, { port });
