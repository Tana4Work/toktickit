# Lab 2 Zen Green UI Specification

## Visual Tokens

| Token | Value/use |
|---|---|
| Primary green | `#006B3C` for header and primary actions |
| Secondary green | `#0B7A46` for links, focus, active tabs, and hover |
| Pale green | `#EAF6EF` for selected/success emphasis |
| Page background | `#F5F7F6` or equivalent quiet near-white |
| Surface | White cards with subtle border and restrained shadow |
| Text | Dark charcoal-green, never pure black |
| Read-only field | Soft gray-green or warm ivory |
| Error | Dark red text and border, message below the field |
| Warning | Amber callout/badge only |
| Success | Green confirmation with text, never color alone |

## Application Shell

- Show TokTickIT identity, My Tickets, Create Ticket, current Requester, and Change Requester.
- Mark the active page clearly.
- Use a responsive navigation pattern on narrow screens.
- Keep the current Requester visible without calling it authenticated.

## Requester Selection

- Explain that the selector is for Lab 2 testing and is not login/authentication.
- Provide an accessible labeled dropdown of active Requesters and a Continue button.
- Show loading, no-active-requester empty state, safe API-failure state, and keyboard focus.
- After Continue, show the selected Requester in the shell.

## Create Ticket

- Group read-only/system-generated fields separately from editable classification and description fields.
- Required fields show a red asterisk plus a nearby text validation message.
- Use consistent field heights; Description is taller and readable.
- Show selected Requester, Category, Related System, Summary, Requested Priority, Description, and Attachments.
- Submit has visible text, a busy state, and is disabled while processing.
- Initial state shows the form; invalid state shows field-level messages; submitting shows progress; success shows the official Ticket Number; API failure preserves entered values; invalid attachments show local errors before upload.

## My Tickets

- Provide search, Category, Related System, Requested Priority, Status filters, sorting, Clear Filters, pagination, and Create Ticket.
- Desktop uses a readable table; narrow screens use cards or a responsive table without horizontal overflow.
- Each row/card identifies the Ticket Number, Summary, Category, Related System, Priority, Status, and last update.
- Distinguish loading, no tickets, no matching results, and API failure.

## Ticket Detail

- Present all ticket fields as read-only, with Ticket Number and Status visually prominent.
- Provide a clear route back to My Tickets.
- Show attachment metadata and action availability based on active/removed state.
- Show loading, missing/unauthorized, and API-failure states without revealing another requester’s data.

## Attachment States

- Selected: show safe display name, type, and size.
- Invalid: show the reason near the file control.
- Uploading: show busy progress/state and prevent duplicate action.
- Active: show metadata and Download.
- Removed: retain metadata and removal reason, disable Download/Preview, and use a non-color indicator.
- Removal requires visible confirmation and the documented reason.

## Responsive and Accessibility Rules

- Verify desktop, tablet, and mobile screenshots for Create Ticket, My Tickets, and Ticket Detail.
- Controls are keyboard reachable in logical order.
- Focus indicators remain visible against all backgrounds.
- Every control has an accessible name; icon-only controls require labels/tooltips.
- Disabled controls are visibly distinct and cannot be activated.
- Do not rely on color alone for priority, status, errors, or attachment state.
- Validate no clipping, overlap, unreadable text, or horizontal overflow at target viewports.
