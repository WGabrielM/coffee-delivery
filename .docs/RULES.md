# Rules

Mandatory process for every task. Follow the steps in order.

## Before development

1. Use the `feature-concept` skill to ask every question needed to fully and accurately understand what must be implemented. Do not start planning with open questions.
2. Create a plan and save it to `./plans/<NNN>-<spec-file-name>-plan.md`. Do not write code before the plan exists.
   - `<spec-file-name>` is the spec's name without its number and extension (`.specs/001-foundation.md` gives `foundation`). A plan's number is its own sequence and is independent from the spec's number.
   - `<NNN>` is a zero-padded sequence number: one higher than the highest number in `./plans/` (`001` if the folder is empty). Numbers are never reused, so the order of the files is the order of creation.
   - Start the plan with a header listing its number, creation date (`YYYY-MM-DD`), and the spec it implements.
   - A new plan for a spec that already has one gets a new number. Never overwrite or renumber an existing plan.

## During development

Follow [DEVELOPMENT.md](DEVELOPMENT.md) and [ARCHITECTURE.md](ARCHITECTURE.md). Run the checks in [QA.md](QA.md).

## At the end of every interaction

Print all of the following:

1. **Architectural decisions**: create an ADR (Architecture Decision Record) at `./adrs/<name>.md` and print a summary of it.
2. **Manual QA steps**: a list of steps to verify the task by hand.
3. **Modified files**: a list of every file changed.
4. **Installed libraries**: a list of every library added.
5. **Rationale**: why you made these decisions, implementations, and changes.

## After a spec is implemented

At the end of each spec execution, once QA passes, run the `commit-and-push` skill to commit and push the changes. It writes a Conventional Commits message, adds Claude Code as co-author, and never force-pushes. Do not ask for permission first. If QA fails and cannot be fixed, do not commit; report the failure. If the push fails because Git has no credentials on the machine, report it and ask the user to push.
