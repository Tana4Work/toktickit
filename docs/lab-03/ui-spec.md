# Lab 3 Zen Green UI Specification

## Application Shell

- Show TokTickIT identity, authenticated user name, role, permitted navigation, password action, and Logout.
- Never show the Lab 2 Development Requester selector or Change Requester action.
- Use existing Zen Green tokens, cards, forms, buttons, badges, focus states, and validation placement.
- Use status, Requested Priority, IT Priority, and role badges consistently.

## Login and First-Login Password Change

- Login has email, password, validation, busy state, inactive-account response, and safe failure feedback.
- Initial-password users see a mandatory Change Password screen and cannot enter normal screens before success.
- Logout removes authenticated access; direct navigation after logout is blocked.

## Requester Screens

- Preserve Lab 2 Ticket and Attachment screens using authenticated ownership.
- Ticket Detail adds visually distinct Public Comments and the Problem Appears Resolved action.
- Internal Notes are never shown to Requesters.

## IT Staff Ticket Queue

- Provide search, suitable filters, sorting, pagination, ownership/status/priority information, and an open-detail action.
- Show loading, empty, no-results, forbidden, not-found, and safe failure states.
- Use a readable desktop table and a card or compact representation on smaller screens.

## IT Staff Ticket Detail

- Group Ticket information clearly and make only permitted operational fields editable.
- Provide owner assignment, IT Priority, permitted status changes, Public Comments, Internal Notes, existing Attachments, and role-specific actions.
- Make Public Comments and Internal Notes visually distinct to prevent accidental disclosure.

## Administrator User Management

- Provide one simple responsive screen with Name, Email, Role, Status, and Edit action.
- Support search by name/email, optional role filter, create, edit, activation, and initial-password reset.
- Show validation, success, forbidden, conflict, and safe API-failure feedback.

## Accessibility and Responsive Checklist

- All controls have accessible names and logical keyboard order.
- Focus indicators remain visible and status is not conveyed by color alone.
- Validate desktop, tablet, and mobile layouts for clipping, overlap, unreadable text, and horizontal overflow.
- Capture screenshots for authentication, staff queue, staff detail, and user management.
