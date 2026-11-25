/** @jsxImportSource react */
/// <reference lib="dom" />
// The admin screen: switch texts, edit one with the Portable Text editor, save.
// React because @portabletext/editor needs it; the controls are Base UI,
// styled in admin.css. It renders from the JSON the server put in the page
// (index.tsx), and Save is a plain form POST.
import { Input } from "@base-ui/react/input";
import { Popover } from "@base-ui/react/popover";
import { Select } from "@base-ui/react/select";
import { Toggle } from "@base-ui/react/toggle";
import { Toolbar } from "@base-ui/react/toolbar";
import {
	defineAnnotation,
	defineBlockObject,
	defineDecorator,
	defineSchema,
	defineTextBlock,
	EditorProvider,
	PortableTextEditable,
	useEditor,
	useEditorSelector,
	type PortableTextBlock,
} from "@portabletext/editor";
import { NodePlugin } from "@portabletext/editor/plugins";
import {
	getActiveAnnotations,
	getActiveListItem,
	getActiveStyle,
	isActiveDecorator,
} from "@portabletext/editor/selectors";
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { AdminData } from "./index.tsx";

// What the customer can do: everything @portabletext/to-html renders on the
// public pages without custom components, and images (blocks.ts, media.ts).
const schemaDefinition = defineSchema({
	decorators: [
		{ name: "strong" },
		{ name: "em" },
		{ name: "underline" },
		{ name: "strike-through" },
	],
	styles: [{ name: "normal" }, { name: "h2" }, { name: "h3" }, { name: "blockquote" }],
	annotations: [{ name: "link", fields: [{ name: "href", type: "string" }] }],
	lists: [{ name: "bullet" }, { name: "number" }],
	inlineObjects: [],
	blockObjects: [
		{
			name: "image",
			fields: [
				{ name: "src", type: "string" },
				{ name: "alt", type: "string" },
				{ name: "width", type: "number" },
				{ name: "height", type: "number" },
			],
		},
	],
});

const nodes = [
	defineTextBlock({
		type: "block",
		render: ({ attributes, children, node }) => {
			if (node.listItem)
				return (
					<div {...attributes} className={`pt-${node.listItem}`}>
						{children}
					</div>
				);
			if (node.style === "h2") return <h2 {...attributes}>{children}</h2>;
			if (node.style === "h3") return <h3 {...attributes}>{children}</h3>;
			if (node.style === "blockquote") return <blockquote {...attributes}>{children}</blockquote>;
			return <p {...attributes}>{children}</p>;
		},
	}),
	defineDecorator({ type: "strong", render: ({ children }) => <strong>{children}</strong> }),
	defineDecorator({ type: "em", render: ({ children }) => <em>{children}</em> }),
	defineDecorator({ type: "underline", render: ({ children }) => <u>{children}</u> }),
	defineDecorator({ type: "strike-through", render: ({ children }) => <s>{children}</s> }),
	defineBlockObject({
		type: "image",
		render: ({ attributes, children, node, selected }) => {
			const image = node as { src?: string; alt?: string };
			return (
				<figure {...attributes} className={selected ? "pt-image selected" : "pt-image"}>
					{children}
					<img src={image.src} alt={image.alt ?? ""} />
					{image.alt ? <figcaption>Alt-tekst: {image.alt}</figcaption> : null}
				</figure>
			);
		},
	}),
	defineAnnotation({
		type: "link",
		render: ({ children, annotation }) => (
			<a href={typeof annotation.href === "string" ? annotation.href : undefined}>{children}</a>
		),
	}),
];

const data = JSON.parse(document.getElementById("admin-data")!.textContent!) as AdminData;

// The switcher's items, grouped by page. The trigger shows "Page: Label".
const groups = data.pages.map((page) => ({
	value: page.title,
	items: page.texts.map((text) => ({ value: text.value, label: `${page.title}: ${text.label}` })),
}));

// Each text has its own URL, so switching loads that page.
function TextSelect() {
	return (
		<Select.Root
			items={groups}
			value={data.current}
			onValueChange={(value) => {
				if (value && value !== data.current) window.location.assign(`/admin/teksten/${value}/`);
			}}
		>
			<Select.Trigger className="select" aria-label="Tekst">
				<Select.Value />
				<Select.Icon className="select-icon">▾</Select.Icon>
			</Select.Trigger>
			<Select.Portal>
				<Select.Positioner sideOffset={4} alignItemWithTrigger={false} align="start">
					<Select.Popup className="popup select-popup">
						<Select.List>
							{data.pages.map((page) => (
								<Select.Group key={page.title} className="select-group">
									<Select.GroupLabel className="select-group-label">{page.title}</Select.GroupLabel>
									{page.texts.map((text) => (
										<Select.Item key={text.value} value={text.value} className="select-item">
											<Select.ItemIndicator className="select-check">✓</Select.ItemIndicator>
											<Select.ItemText>{text.label}</Select.ItemText>
										</Select.Item>
									))}
								</Select.Group>
							))}
						</Select.List>
					</Select.Popup>
				</Select.Positioner>
			</Select.Portal>
		</Select.Root>
	);
}

// A click on a format button leaves the focus and selection in the editor.
const keepFocus = (event: { preventDefault: () => void }) => event.preventDefault();

function FormatToolbar() {
	const editor = useEditor();
	const style = useEditorSelector(editor, getActiveStyle);
	const list = useEditorSelector(editor, getActiveListItem);
	const bold = useEditorSelector(editor, isActiveDecorator("strong"));
	const italic = useEditorSelector(editor, isActiveDecorator("em"));
	const underline = useEditorSelector(editor, isActiveDecorator("underline"));
	const strike = useEditorSelector(editor, isActiveDecorator("strike-through"));

	const send = (event: Parameters<typeof editor.send>[0]) => {
		editor.send(event);
		editor.send({ type: "focus" });
	};
	const toggle = (label: string, title: string, pressed: boolean, onClick: () => void) => (
		<Toolbar.Button
			className="tool"
			aria-label={title}
			title={title}
			onMouseDown={keepFocus}
			render={<Toggle pressed={pressed} onPressedChange={onClick} />}
		>
			{label}
		</Toolbar.Button>
	);
	const button = (label: string, title: string, onClick: () => void) => (
		<Toolbar.Button
			className="tool"
			aria-label={title}
			title={title}
			onMouseDown={keepFocus}
			onClick={onClick}
		>
			{label}
		</Toolbar.Button>
	);
	const decorator = (name: string) => () => send({ type: "decorator.toggle", decorator: name });
	const blockStyle = (name: string) => () => send({ type: "style.toggle", style: name });
	const listItem = (name: string) => () => send({ type: "list item.toggle", listItem: name });

	return (
		<Toolbar.Root className="toolbar" aria-label="Opmaak">
			<Toolbar.Group className="tool-group" aria-label="Tekst">
				{toggle("B", "Vet", bold, decorator("strong"))}
				{toggle("I", "Cursief", italic, decorator("em"))}
				{toggle("U", "Onderstreept", underline, decorator("underline"))}
				{toggle("S", "Doorgehaald", strike, decorator("strike-through"))}
			</Toolbar.Group>
			<Toolbar.Separator className="separator" />
			<Toolbar.Group className="tool-group" aria-label="Alinea">
				{toggle("H2", "Kop", style === "h2", blockStyle("h2"))}
				{toggle("H3", "Subkop", style === "h3", blockStyle("h3"))}
				{toggle("❝", "Citaat", style === "blockquote", blockStyle("blockquote"))}
				{toggle("•", "Lijst", list === "bullet", listItem("bullet"))}
				{toggle("1.", "Genummerde lijst", list === "number", listItem("number"))}
			</Toolbar.Group>
			<Toolbar.Separator className="separator" />
			<LinkPopover send={send} />
			{data.media && <ImagePopover />}
			<Toolbar.Separator className="separator" />
			<Toolbar.Group className="tool-group" aria-label="Geschiedenis">
				{button("↶", "Ongedaan maken", () => send({ type: "history.undo" }))}
				{button("↷", "Opnieuw", () => send({ type: "history.redo" }))}
			</Toolbar.Group>
			<span className="spacer"></span>
			{data.saved && (
				<span role="status" className="saved">
					Opgeslagen
				</span>
			)}
			<Toolbar.Button type="submit" className="button primary">
				Opslaan
			</Toolbar.Button>
		</Toolbar.Root>
	);
}

// Adds, changes or removes the link on the selected text.
function LinkPopover(props: { send: ReturnType<typeof useEditor>["send"] }) {
	const editor = useEditor();
	const link = useEditorSelector(editor, (s) =>
		getActiveAnnotations(s).find((a) => a._type === "link"),
	);
	const [open, setOpen] = useState(false);
	const [href, setHref] = useState("");

	const apply = () => {
		setOpen(false);
		if (link) props.send({ type: "annotation.remove", annotation: { name: "link" } });
		if (href.trim() !== "") {
			props.send({ type: "annotation.add", annotation: { name: "link", value: { href } } });
		}
		editor.send({ type: "focus" });
	};

	return (
		<Popover.Root
			open={open}
			onOpenChange={(next) => {
				if (next) setHref(typeof link?.href === "string" ? link.href : "");
				setOpen(next);
			}}
		>
			<Popover.Trigger
				render={<Toolbar.Button className="tool" data-pressed={link ? "" : undefined} />}
			>
				Link
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Positioner sideOffset={4} align="start">
					<Popover.Popup className="popup link-popup">
						<Popover.Title className="popup-title">Link</Popover.Title>
						<Input
							className="input"
							type="url"
							placeholder="https://…"
							aria-label="Adres van de link"
							value={href}
							onValueChange={setHref}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									apply();
								}
							}}
						/>
						<div className="row">
							<button type="button" className="button primary" onClick={apply}>
								{href.trim() === "" && link ? "Verwijderen" : "Toepassen"}
							</button>
						</div>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

// Uploads an image to R2 (POST /admin/media) and inserts it as an image block
// at the cursor. The text keeps only the path; Save stores it like the rest.
function ImagePopover() {
	const editor = useEditor();
	const [open, setOpen] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [alt, setAlt] = useState("");
	const [busy, setBusy] = useState(false);
	const [problem, setProblem] = useState("");

	const insert = async () => {
		if (!file) return setProblem("Kies een afbeelding.");
		if (alt.trim() === "") return setProblem("Beschrijf de afbeelding voor wie hem niet ziet.");
		setBusy(true);
		setProblem("");
		try {
			const bitmap = await createImageBitmap(file);
			const body = new FormData();
			body.append("file", file);
			const res = await fetch("/admin/media", { method: "POST", body });
			if (!res.ok) throw new Error(await res.text());
			const { src } = (await res.json()) as { src: string };
			editor.send({
				type: "insert.block object",
				blockObject: {
					name: "image",
					value: { src, alt: alt.trim(), width: bitmap.width, height: bitmap.height },
				},
				placement: "auto",
			});
			editor.send({ type: "focus" });
			setOpen(false);
		} catch (e) {
			setProblem((e as Error).message || "Uploaden is niet gelukt.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<Popover.Root
			open={open}
			onOpenChange={(next) => {
				if (next) {
					setFile(null);
					setAlt("");
					setProblem("");
				}
				setOpen(next);
			}}
		>
			<Popover.Trigger render={<Toolbar.Button className="tool" />}>Afbeelding</Popover.Trigger>
			<Popover.Portal>
				<Popover.Positioner sideOffset={4} align="start">
					<Popover.Popup className="popup link-popup">
						<Popover.Title className="popup-title">Afbeelding</Popover.Title>
						<input
							className="file"
							type="file"
							accept="image/jpeg,image/png,image/webp,image/avif"
							aria-label="Afbeelding (JPEG, PNG, WebP of AVIF, tot 5 MB)"
							onChange={(event) => setFile(event.target.files?.[0] ?? null)}
						/>
						<Input
							className="input"
							placeholder="Wat staat erop?"
							aria-label="Alt-tekst"
							value={alt}
							onValueChange={setAlt}
						/>
						{problem && (
							<p className="problem" role="alert">
								{problem}
							</p>
						)}
						<div className="row">
							<button type="button" className="button primary" onClick={insert} disabled={busy}>
								{busy ? "Bezig…" : "Invoegen"}
							</button>
						</div>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

// The editor reports changes with a delay, so read its value at submit.
function EditForm() {
	const editor = useEditor();
	const field = useRef<HTMLInputElement>(null);
	return (
		<form
			method="post"
			className="edit"
			onSubmit={() => {
				field.current!.value = JSON.stringify(editor.getSnapshot().context.value ?? []);
			}}
		>
			<FormatToolbar />
			<PortableTextEditable className="editable" />
			<input type="hidden" name="value" ref={field} />
		</form>
	);
}

function Screen() {
	return (
		<EditorProvider
			initialConfig={{ schemaDefinition, initialValue: data.value as PortableTextBlock[] }}
		>
			<NodePlugin nodes={nodes} />
			<header className="bar">
				<TextSelect />
				<a className="button" href={data.pagePath} target="_blank">
					Bekijk de pagina
				</a>
				<span className="email">{data.email}</span>
				<form method="post" action="/admin/uitloggen">
					<button type="submit" className="button">
						Uitloggen
					</button>
				</form>
			</header>
			<main>
				<EditForm />
			</main>
		</EditorProvider>
	);
}

createRoot(document.getElementById("admin")!).render(<Screen />);
