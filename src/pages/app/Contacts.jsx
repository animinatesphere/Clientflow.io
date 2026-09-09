import { useState, useRef } from "react";
import { Upload, UserPlus, Trash2, Users, FileWarning, Download } from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Field,
  Input,
  Select,
  Checkbox,
  Modal,
  SearchInput,
  Segmented,
  Table,
  Th,
  Td,
  Tr,
  Loading,
  EmptyState,
  useToast,
} from "../../components/ui";
import { useAsync } from "../../lib/hooks";
import api from "../../lib/api";
import { num, fullDate } from "../../lib/format";

export default function Contacts() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const toast = useToast();

  const { data, loading, reload } = useAsync(() => api.contacts.list({ search: q, status }), [q, status]);
  const rows = data?.rows ?? [];
  const allOn = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const removeSelected = async () => {
    await api.contacts.removeMany(selected);
    toast(`${selected.length} contacts deleted`, "stop");
    setSelected([]);
    reload();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "suppressed", label: "Suppressed" },
          ]}
        />
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search name, company or address" className="w-full max-w-xs" />
          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            <UserPlus size={15} /> Add one
          </Button>
          <Button onClick={() => setImportOpen(true)}>
            <Upload size={15} /> Import CSV
          </Button>
        </div>
      </div>

      {selected.length > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-ink bg-ink px-5 py-3">
          <p className="text-[14px] text-white">
            <span className="font-medium tnum">{selected.length}</span> selected
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="onDarkGhost" onClick={() => setSelected([])}>
              Clear
            </Button>
            <Button size="sm" variant="onDarkGhost">
              <Download size={14} /> Export
            </Button>
            <Button size="sm" variant="stamp" onClick={removeSelected}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <Loading rows={7} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={q ? "No contacts match that" : "Your list is empty"}
            description={
              q
                ? "Try a shorter search term."
                : "Import a CSV to get started. You will map the columns yourself and see exactly what was rejected."
            }
            action={
              <Button onClick={() => setImportOpen(true)}>
                <Upload size={15} /> Import a CSV
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th className="w-10">
                    <Checkbox
                      checked={allOn}
                      onChange={() => setSelected(allOn ? [] : rows.map((r) => r.id))}
                    />
                  </Th>
                  <Th>Contact</Th>
                  <Th>Company</Th>
                  <Th>Title</Th>
                  <Th>List</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Added</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Checkbox
                        checked={selected.includes(c.id)}
                        onChange={() =>
                          setSelected((s) =>
                            s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]
                          )
                        }
                      />
                    </Td>
                    <Td>
                      <p className="font-medium">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-[13px] text-slate">{c.email}</p>
                    </Td>
                    <Td className="text-slate">{c.company}</Td>
                    <Td className="text-[13.5px] text-slate">{c.title}</Td>
                    <Td className="text-[13.5px] text-slate">{c.lists?.[0]}</Td>
                    <Td>
                      <Badge status={c.status} />
                    </Td>
                    <Td className="text-right text-[13.5px] text-slate">{fullDate(c.addedAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <p className="border-t border-rule bg-paper px-5 py-3 text-[13.5px] text-slate">
              {num(rows.length)} contacts shown
            </p>
          </>
        )}
      </Card>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onDone={reload} />
      <AddContactModal open={addOpen} onClose={() => setAddOpen(false)} onDone={reload} />
    </div>
  );
}

/* ── Import ───────────────────────────────────────────────────────────── */

function ImportModal({ open, onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [listName, setListName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const toast = useToast();

  const reset = () => {
    setFile(null);
    setResult(null);
    setListName("");
  };

  const run = async () => {
    setBusy(true);
    try {
      const r = await api.contacts.import(file, listName);
      setResult(r);
      onDone?.();
    } catch (e) {
      toast(e.message || "Import failed", "stop");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={result ? "Import finished" : "Import contacts"}
      description={
        result
          ? "Here is exactly what happened to every row."
          : "CSV or TSV. The first row must be a header."
      }
      width="max-w-xl"
      footer={
        result ? (
          <>
            <Button variant="secondary" onClick={reset}>
              Import another
            </Button>
            <Button
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Done
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!file} loading={busy} onClick={run}>
              Import {file ? file.name : "file"}
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-4">
            {[
              ["Added", result.imported, "text-signal"],
              ["Already there", result.duplicates, "text-slate"],
              ["Rejected", result.invalid, "text-stamp"],
              ["Suppressed", result.suppressed, "text-hold"],
            ].map(([k, v, tone]) => (
              <div key={k} className="bg-white px-4 py-3">
                <p className="text-[13px] text-slate">{k}</p>
                <p className={`mt-1 font-display text-[22px] font-semibold tnum ${tone}`}>{num(v)}</p>
              </div>
            ))}
          </div>
          {result.invalid > 0 && (
            <Card className="flex items-start gap-3 border-stamp/30 bg-stamp-soft p-4">
              <FileWarning size={17} className="mt-0.5 shrink-0 text-stamp" />
              <div>
                <p className="text-[14px] font-medium">{result.invalid} rows were not usable</p>
                <p className="mt-1 text-[13.5px] text-slate">
                  Missing or malformed email addresses. Download them, fix the addresses, and
                  import again.
                </p>
                <Button size="sm" variant="secondary" className="mt-3">
                  <Download size={14} /> Download rejected rows
                </Button>
              </div>
            </Card>
          )}
          {result.suppressed > 0 && (
            <p className="text-[14px] text-slate">
              {result.suppressed} addresses were skipped because they are on your suppression list.
              They stay suppressed and will not be contacted.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              setFile(e.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors ${
              drag ? "border-route bg-route-soft" : file ? "border-signal bg-signal-soft" : "border-rule bg-paper"
            }`}
          >
            <Upload size={22} className="mx-auto text-slate" />
            <p className="mt-3 text-[15px] font-medium">
              {file ? file.name : "Drop a CSV here, or click to choose"}
            </p>
            <p className="mt-1 text-[13.5px] text-slate">
              {file ? `${(file.size / 1024).toFixed(0)} KB — ready to import` : "Up to 100MB"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.tsv,text/csv"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <Field label="Add to list" hint="Optional. Lets you target this batch later.">
            <Input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Q3 UK manufacturing"
            />
          </Field>

          <div className="rounded-card border border-rule bg-paper p-4">
            <p className="text-[13.5px] font-medium">Columns the importer recognises</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate">
              email, first_name, last_name, full_name, company, title. Anything else is kept and
              becomes available as a merge tag. You confirm the mapping before anything is saved.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ── Add one ──────────────────────────────────────────────────────────── */

function AddContactModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", company: "", title: "" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    await api.contacts.create(form);
    setBusy(false);
    toast(`${form.firstName || form.email} added`);
    setForm({ firstName: "", lastName: "", email: "", company: "", title: "" });
    onDone?.();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a contact"
      description="Checked against your suppression list before it is saved."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} disabled={!form.email} onClick={save}>
            Add contact
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input value={form.firstName} onChange={set("firstName")} placeholder="Marcus" />
          </Field>
          <Field label="Last name">
            <Input value={form.lastName} onChange={set("lastName")} placeholder="Bello" />
          </Field>
        </div>
        <Field label="Email address">
          <Input type="email" value={form.email} onChange={set("email")} placeholder="marcus@halden.com" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company">
            <Input value={form.company} onChange={set("company")} placeholder="Halden Logistics" />
          </Field>
          <Field label="Job title">
            <Input value={form.title} onChange={set("title")} placeholder="Operations Manager" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
