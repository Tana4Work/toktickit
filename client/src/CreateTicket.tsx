import { FormEvent, useEffect, useState } from "react";
import { Category, createTicket, fetchCategories, fetchRelatedSystems, RelatedSystem, TicketPriority } from "./api.js";
import { useRequester } from "./requesterContext.js";

type FormValues = { categoryId: string; relatedSystemId: string; summary: string; requestedPriority: TicketPriority | ""; description: string };
type FormErrors = Partial<Record<keyof FormValues, string>>;
const initialValues: FormValues = { categoryId: "", relatedSystemId: "", summary: "", requestedPriority: "", description: "" };

export default function CreateTicket() {
  const { currentRequester } = useRequester();
  const [values, setValues] = useState(initialValues);
  const [categories, setCategories] = useState<Category[]>([]);
  const [systems, setSystems] = useState<RelatedSystem[]>([]);
  const [referenceState, setReferenceState] = useState<"loading" | "ready" | "error">("loading");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errors, setErrors] = useState<FormErrors>({});
  const [createdTicket, setCreatedTicket] = useState<{ ticketNumber: string; ticketDate: string; currentStatus: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchCategories(), fetchRelatedSystems()]).then(([loadedCategories, loadedSystems]) => {
      if (!mounted) return;
      setCategories(loadedCategories); setSystems(loadedSystems); setReferenceState("ready");
    }).catch(() => { if (mounted) setReferenceState("error"); });
    return () => { mounted = false; };
  }, []);

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (submitState === "error") setSubmitState("idle");
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!values.categoryId) next.categoryId = "Category is required.";
    if (!values.relatedSystemId) next.relatedSystemId = "Related System is required.";
    if (values.summary.trim().length < 3 || values.summary.trim().length > 120) next.summary = "Summary must be between 3 and 120 characters.";
    if (!values.requestedPriority) next.requestedPriority = "Requested Priority is required.";
    if (values.description.trim().length < 10 || values.description.trim().length > 2000) next.description = "Description must be between 10 and 2000 characters.";
    return next;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(); setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !currentRequester) return;
    setSubmitState("submitting");
    try {
      const ticket = await createTicket({ requesterId: currentRequester.id, categoryId: Number(values.categoryId), relatedSystemId: Number(values.relatedSystemId), summary: values.summary.trim(), requestedPriority: values.requestedPriority as TicketPriority, description: values.description.trim() }, crypto.randomUUID());
      setCreatedTicket(ticket); setSubmitState("success");
    } catch { setSubmitState("error"); }
  }

  if (!currentRequester) return <p className="mt-5" role="status">Select a Development Requester before creating a ticket.</p>;
  if (referenceState === "loading") return <p className="mt-5" role="status">Loading ticket reference data...</p>;
  if (referenceState === "error") return <p className="mt-5 text-danger" role="status">Unable to load ticket reference data. Please try again.</p>;

  return <section className="mt-5" aria-labelledby="create-ticket-heading">
    <h2 id="create-ticket-heading" className="h4">Create Ticket</h2>
    <p className="text-secondary">Requester: {currentRequester.name}</p>
    {submitState === "success" && createdTicket && <div className="alert alert-success" role="status"><strong>Ticket created: {createdTicket.ticketNumber}</strong><div>Ticket Date: {new Date(createdTicket.ticketDate).toLocaleString()}</div><div>Status: {createdTicket.currentStatus}</div></div>}
    {submitState === "error" && <p className="text-danger" role="alert">Unable to create ticket. Your entered values are still available.</p>}
    <form onSubmit={submit} noValidate>
      <div className="mb-3"><label className="form-label" htmlFor="ticket-category">Category *</label><select id="ticket-category" aria-label="Category *" className={`form-select ${errors.categoryId ? "is-invalid" : ""}`} value={values.categoryId} onChange={(e) => update("categoryId", e.target.value)}><option value="">Select a Category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.categoryId && <div className="invalid-feedback">{errors.categoryId}</div>}</div>
      <div className="mb-3"><label className="form-label" htmlFor="ticket-system">Related System *</label><select id="ticket-system" aria-label="Related System *" className={`form-select ${errors.relatedSystemId ? "is-invalid" : ""}`} value={values.relatedSystemId} onChange={(e) => update("relatedSystemId", e.target.value)}><option value="">Select a Related System</option>{systems.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}</select>{errors.relatedSystemId && <div className="invalid-feedback">{errors.relatedSystemId}</div>}</div>
      <div className="mb-3"><label className="form-label" htmlFor="ticket-summary">Summary *</label><input id="ticket-summary" aria-label="Summary *" className={`form-control ${errors.summary ? "is-invalid" : ""}`} value={values.summary} onChange={(e) => update("summary", e.target.value)} />{errors.summary && <div className="invalid-feedback">{errors.summary}</div>}</div>
      <div className="mb-3"><label className="form-label" htmlFor="ticket-priority">Requested Priority *</label><select id="ticket-priority" aria-label="Requested Priority *" className={`form-select ${errors.requestedPriority ? "is-invalid" : ""}`} value={values.requestedPriority} onChange={(e) => update("requestedPriority", e.target.value)}><option value="">Select Priority</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select>{errors.requestedPriority && <div className="invalid-feedback">{errors.requestedPriority}</div>}</div>
      <div className="mb-3"><label className="form-label" htmlFor="ticket-description">Description *</label><textarea id="ticket-description" aria-label="Description *" className={`form-control ${errors.description ? "is-invalid" : ""}`} rows={5} value={values.description} onChange={(e) => update("description", e.target.value)} />{errors.description && <div className="invalid-feedback">{errors.description}</div>}</div>
      <button className="btn btn-success" type="submit" disabled={submitState === "submitting"}>{submitState === "submitting" ? "Submitting..." : "Submit Ticket"}</button>
    </form>
  </section>;
}
