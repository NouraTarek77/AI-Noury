import app from "../server/server.js";

export default function handler(req, res) {
  if (req.url.startsWith("/api/index")) {
    req.url = req.url.replace(
      "/api/index",
      ""
    );
  }

  return app(req, res);
}