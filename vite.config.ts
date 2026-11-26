import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite-plus";

export default defineConfig({
	plugins: [cloudflare()],
	// The admin's browser code (src/admin.ts), built into the assets as
	// /admin/admin.js and /admin/style.css. Public pages load neither.
	environments: {
		client: {
			build: {
				// The admin bundle is React, Base UI and the editor, about 850 kB.
				chunkSizeWarningLimit: 1000,
				rolldownOptions: {
					// Base UI marks its modules "use client", which means nothing here.
					onwarn(warning, warn) {
						if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning);
					},
					input: { admin: "src/admin.ts" },
					output: {
						entryFileNames: "admin/[name].js",
						chunkFileNames: "admin/[name]-[hash].js",
						assetFileNames: "admin/style[extname]",
					},
				},
			},
		},
	},
	fmt: { useTabs: true },
	lint: {
		options: { typeAware: true, typeCheck: true },
	},
});
