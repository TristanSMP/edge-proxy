import net from "node:net";
import { WebSocket, WebSocketServer } from "ws";

console.log("Starting tcp-over-ws");

if (process.env.RUN_BACKEND === "true") {
  const backendPort = process.env.BACKEND_PORT
    ? parseInt(process.env.PORT)
    : 8080;
  const wss = new WebSocketServer({ port: backendPort });
  const log = (msg) => console.log(`[backend] ${msg}`);
  const mcServerConnectDetails = {
    host: process.env.MC_SERVER_HOST || "localhost",
    port: process.env.MC_SERVER_PORT
      ? parseInt(process.env.MC_SERVER_PORT)
      : 25565,
  };

  wss.on("listening", () => {
    log(`Backend websocket ready on port ${backendPort}`);
  });

  wss.on("connection", (ws) => {
    log("New connection");

    const mcServer = net.createConnection({
      host: mcServerConnectDetails.host,
      port: mcServerConnectDetails.port,
    });

    ws.on("message", (data) => mcServer.write(data));
    mcServer.on("data", (data) => ws.send(data));
  });
}

if (process.env.RUN_FRONTEND === "true") {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8081;
  const backend = process.env.BACKEND_URL || "ws://localhost:8080";
  const log = (msg) => console.log(`[frontend] ${msg}`);

  const server = net.createServer();

  server.on("connection", (socket) => {
    log("New connection");

    const ws = new WebSocket(backend);

    ws.on("open", () => {
      log("Connected to backend websocket");

      socket.on("data", (data) => ws.send(data));
      ws.on("message", (data) => socket.write(data));
    });

    ws.on("close", () => {
      log("Disconnected from backend websocket");
      socket.end();
    });
  });

  server.listen(port, () => {
    log(`Frontend websocket ready on port ${port}`);
  });
}
