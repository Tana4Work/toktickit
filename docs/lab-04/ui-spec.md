# Lab 4 UI Specification

## Application Shell

- Preserve the Zen Green shell, authenticated identity, role navigation, Logout, visible focus, and active-page indication.
- Add role-appropriate Dashboard navigation.
- Reuse existing Ticket, tab, badge, button, form, table, card, loading, empty, error, and responsive conventions.
- Distinguish Ticket status, priorities, and shared/private content using color plus text or other non-color cues.

## Actions Taken on Ticket Detail

- IT Staff Ticket Detail contains an Actions Taken list/table with stable chronological ordering.
- Staff can switch between create and view/edit modes.
- Required fields are Action Date/Time, Description, Result, Performed by, Follow-up Required, Follow-up Note, and Attachment Notes.
- `Performed by` is displayed as read-only authenticated information.
- Follow-up Note becomes required when Follow-up Required is selected.
- Requesters see permitted Actions Taken information in read-only mode.
- Staff receive clear success, validation, conflict, forbidden, not-found, and safe-failure feedback.
- Repeated submissions are disabled or safely deduplicated, and recoverable failures preserve entered values.

## Ticket Workflow

- Show only status transitions permitted for the current role and Ticket state.
- The UI guides the user but does not replace backend enforcement.
- A Requester problem-resolved indication is clearly advisory and does not display as a formal Resolved change until staff completes the approved workflow.
- Successful workflow changes refresh the Ticket summary and status.

## Requester Dashboard

- Show concise cards for open Tickets, waiting for Requester, recently updated, and recently resolved Tickets.
- Show recent or attention-required Ticket items without duplicating the full My Tickets screen.
- Every card or actionable item has a practical drill-down to My Tickets, a filtered list, or Ticket Detail.
- Show only authenticated Requester-owned data.

## IT Staff and Administrator Dashboards

- Show cards for unassigned Tickets, current-user-owned Tickets, status/priority counts, recently updated Tickets, and approved current-user Actions Taken/recent urgent Tickets.
- Keep the dashboard concise and connected to Queue and Ticket Detail.
- Administrators receive only the approved Staff dashboard reuse/extension.

## Shared States and Accessibility

- Define loading, empty, no-results, forbidden, not-found, conflict, validation, success, and safe API-failure states for each screen.
- All controls have accessible names and logical keyboard order.
- Focus remains visible and status is not conveyed by color alone.
- Dialogs, tables, forms, and error messages remain usable with keyboard and assistive technology.
- Desktop, tablet, and mobile layouts must not clip content, overlap controls, create inaccessible dialogs, or require horizontal page scrolling.

## Visual Evidence

Capture readable desktop, tablet, and mobile screenshots for the Staff Dashboard, Requester Dashboard, Actions Taken, Ticket workflow, and representative regression screens.
