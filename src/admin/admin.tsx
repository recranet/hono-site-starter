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

// What the customer can do: bold, italic, link, heading, list. Public pages
// render the same with @portabletext/to-html (blocks.ts).
const schemaDefinition = defineSchema({
	decorators: [{ name: "strong" }, { name: "em" }],
	styles: [{ name: "normal" }, { name: "h2" }],
	annotations: [{ name: "link", fields: [{ name: "href", type: "string" }] }],
	lists: [{ name: "bullet" }],
	inlineObjects: [],
	blockObjects: [],
});

const nodes = [
	defineTextBlock({
		type: "block",
		render: ({ attributes, children, node }) => {
			if (node.style === "h2") return <h2 {...attributes}>{children}</h2>;
			if (node.listItem)
				return (
					<div {...attributes} className="pt-bullet">
						{children}
					</div>
				);
			return <p {...attributes}>{children}</p>;
		},
	}),
	defineDecorator({ type: "strong", render: ({ children }) => <strong>{children}</strong> }),
	defineDecorator({ type: "em", render: ({ children }) => <em>{children}</em> }),
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

function FormatToolbar() {
	const editor = useEditor();
	const style = useEditorSelector(editor, getActiveStyle);
	const list = useEditorSelector(editor, getActiveListItem);
	const bold = useEditorSelector(editor, isActiveDecorator("strong"));
	const italic = useEditorSelector(editor, isActiveDecorator("em"));

	const send = (event: Parameters<typeof editor.send>[0]) => {
		editor.send(event);
		editor.send({ type: "focus" });
	};
	const toggle = (label: string, pressed: boolean, onClick: () => void) => (
		<Toolbar.Button
			className="tool"
			render={<Toggle pressed={pressed} onPressedChange={onClick} />}
		>
			{label}
		</Toolbar.Button>
	);

	return (
		<Toolbar.Root className="toolbar" aria-label="Opmaak">
			{toggle("Vet", bold, () => send({ type: "decorator.toggle", decorator: "strong" }))}
			{toggle("Cursief", italic, () => send({ type: "decorator.toggle", decorator: "em" }))}
			{toggle("Kop", style === "h2", () => send({ type: "style.toggle", style: "h2" }))}
			{toggle("Lijst", list === "bullet", () =>
				send({ type: "list item.toggle", listItem: "bullet" }),
			)}
			<Toolbar.Separator className="separator" />
			<LinkPopover send={send} />
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
			<div className="row">
				<button type="submit" className="button primary">
					Opslaan
				</button>
				{data.saved && (
					<span role="status" className="saved">
						De tekst is opgeslagen.
					</span>
				)}
			</div>
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
