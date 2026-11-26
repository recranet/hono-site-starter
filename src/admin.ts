// The admin's browser code, built by Vite into /admin/admin.js and
// /admin/style.css (vite.config.ts). Public pages load neither. A site's own
// block editors (defineBlockEditor) are registered here next to the package's.
import "@recranet/worker-site-editor/admin.css";
import { mountAdmin } from "@recranet/worker-site-editor/admin";
import { heroEditor, labelsEditor } from "@recranet/worker-site-editor/extensions/admin";

mountAdmin({ editors: [heroEditor, labelsEditor] });
