import net from "node:net";

console.log("Starting tcp-tunnel");

const port = process.env.PORT ? parseInt(process.env.PORT) : 8081;
const mcServerConnectDetails = {
  host: process.env.MC_SERVER_HOST || "localhost",
  port: process.env.MC_SERVER_PORT
    ? parseInt(process.env.MC_SERVER_PORT)
    : 25565,
};
const log = (msg) => console.log(`[frontend] ${msg}`);

const server = net.createServer();

server.on("connection", (socket) => {
  log("New connection");

  const mcServer = net.createConnection({
    host: mcServerConnectDetails.host,
    port: mcServerConnectDetails.port,
  });

  socket.pipe(mcServer);
  mcServer.pipe(socket);

  socket.on("close", () => {
    log("Connection closed");
    mcServer.destroy();
  });
});

server.listen(port, () => {
  log(`Frontend websocket ready on port ${port}`);
});
