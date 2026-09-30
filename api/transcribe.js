import app from "../server/server.js";

export default function handler(req, res) {
  req.url = "/transcribe";
  return app(req, res);
}
