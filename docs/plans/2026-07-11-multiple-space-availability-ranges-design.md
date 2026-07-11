# Multiple availability ranges per space and day

## Goal

Allow each space to define more than one recurring availability range on the same weekday. For example, Monday can operate from 08:00 to 12:00 and again from 14:00 to 22:00 without allowing bookings through the break.

Bookings continue to use whole-hour start times and durations. Overnight ranges remain out of scope; they must be represented as separate ranges on consecutive days.

## Data model

Reuse `space_availability_rules` as a collection of active availability windows. A space may have zero or more rows for each `day_of_week`:

- no rows for a weekday means the space is closed that day;
- one row represents one continuous availability window;
- multiple rows represent separate windows on the same day.

Existing active rules are retained. Existing inactive rules are omitted when availability is next saved. Keep `is_active` during the transition for compatibility, but all newly saved windows are active.

Add database safeguards for valid weekday values and `start_time < end_time`, plus an index on `(space_id, day_of_week)`. Cross-row overlap validation remains in the application because a normal check constraint cannot compare sibling rows.

## Administration UX

Replace the fixed one-row-per-day editor with a client-side weekly availability editor:

- every weekday has an open/closed control;
- an open day contains one or more start/end rows;
- administrators can add or remove ranges without a fixed maximum;
- ranges are sorted by start time;
- overlapping, duplicated, inverted, or empty ranges show inline errors;
- adjacent ranges are accepted, although the UI may suggest merging them;
- closing a day removes its submitted ranges.

The parent space form remains responsible for the rest of the space data. The availability editor serializes its normalized ranges into a hidden form field, and the server parses and validates that field rather than trusting the browser.

## Booking UX

Reorder the member booking flow to: space, date, duration, available start time.

After space, date, and duration are selected, show only start times that fit completely inside one availability window. The final server validation remains authoritative and also checks operational blocks, active bookings, the global booking buffer, space status, plan validity, and quota.

The initial implementation may calculate weekly-window candidates in the client, but occupied and blocked times must be resolved by a server-backed availability query so users do not select a slot that is already known to be unavailable.

## Server behavior

Space create and update actions accept a variable-length array of availability windows. They validate time format, weekday bounds, ordering, duplicates, and overlaps. Space creation and its availability rows are written in one transaction; updates continue replacing all availability rows transactionally.

Booking validation changes from selecting the first active weekday rule to accepting the booking when any active range for that weekday fully contains the requested interval. A booking cannot span two ranges, even if both are on the same day.

The slot availability query combines:

1. recurring windows for the selected weekday;
2. whole-hour duration and space minimum/maximum duration;
3. operational blocks;
4. pending or confirmed bookings;
5. the configured booking buffer.

## Error handling

Admin validation errors identify the weekday and conflicting ranges. Booking submission retains server-side validation to handle stale availability and concurrent requests. If a slot becomes unavailable between display and confirmation, the user receives a specific conflict message and can reload the available times.

## Testing

Cover:

- schema acceptance of multiple non-overlapping ranges;
- rejection of invalid, duplicated, and overlapping ranges;
- serialization and editing behavior in the weekly editor;
- create and update persistence for variable-length rules;
- bookings inside either range;
- rejection of bookings in or across a gap;
- duration-aware slot generation near each range boundary;
- removal of slots affected by blocks, bookings, and buffer;
- preservation of timezone behavior in `America/Argentina/Buenos_Aires`;
- an end-to-end flow that configures a split Monday schedule and books within the second range.

## Out of scope

- half-hour or arbitrary-minute booking durations;
- ranges that cross midnight;
- recurring schedules that vary by season or effective date;
- recurring holiday calendars;
- automatic merging of adjacent ranges.
