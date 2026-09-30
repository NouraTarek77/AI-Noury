import app from "../server/server.js";

export default function handler(req, res) {
  req.url = "/chat";
  return app(req, res);
}