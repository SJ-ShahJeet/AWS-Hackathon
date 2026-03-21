import { defineConfig, type Plugin, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { AccessToken } from 'livekit-server-sdk';
import { handleHedraUpload } from "./scripts/hedra-upload.js";

function devApiMiddleware(env: Record<string, string>): Plugin {
  return {
    name: "dev-api-middleware",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === "POST" && req.url?.startsWith("/api/hedra/upload")) {
          await handleHedraUpload(req, res, env);
          return;
        }
        if (req.url && req.url.startsWith('/api/config')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            enableAvatar: true,
            providers: { voice: [] },
            defaultTtsProvider: '',
            defaultHedraAvatarId: env.HEDRA_DEFAULT_AVATAR_ID?.trim() || null,
          }));
          return;
        }
        if (req.url && req.url.startsWith('/api/getToken')) {
          try {
            const livekitHost = env.LIVEKIT_URL;
            const apiKey = env.LIVEKIT_API_KEY;
            const apiSecret = env.LIVEKIT_API_SECRET;

            if (!livekitHost || !apiKey || !apiSecret) {
              console.error('LiveKit env missing in dev server. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET');
              res.statusCode = 500;
              res.end('Server not configured');
              return;
            }

            const url = new URL(req.url, 'http://localhost');
            const name = url.searchParams.get('name') || 'guest';
            const avatar = url.searchParams.get('avatar');
            const avatarId = url.searchParams.get('avatar_id');
            let room = url.searchParams.get('room') || '';
            if (!room) {
              const avatarSuffix = (avatar === 'hedra' || avatar === 'tavus') ? avatar : null;
              room = `room-${Math.random().toString(36).slice(2, 10)}`;
              if (avatarSuffix) {
                room = `${room}-a-${avatarSuffix}`;
                if (avatarSuffix === 'hedra' && avatarId) {
                  room = `${room}-${avatarId}`;
                }
              }
            }

            const at = new AccessToken(apiKey, apiSecret, {
              identity: name,
              name,
            });
            at.addGrant({
              roomJoin: true,
              room,
              canPublish: true,
              canSubscribe: true,
            });

            const jwt = await at.toJwt();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(jwt);
            return;
          } catch (e) {
            console.error('getToken error', e);
            // fall through
          }
        }
        if (req.url && req.url.startsWith('/api/hello')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ message: 'Hello from Vite dev API \uD83D\uDC4B', timestamp: new Date().toISOString() }));
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(process.cwd(), ".."), "");
  const env = { ...rootEnv, ...loadEnv(mode, process.cwd(), "") };
  return ({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        // Do not rewrite; FastAPI serves under /api
        // rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  },
  plugins: [
    react(),
    devApiMiddleware(env),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@src": path.resolve(__dirname, "./src"),
    },
  },
  
  });
});
