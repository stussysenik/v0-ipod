# Legacy Toolbox Archive

This directory freezes the pre-Kumo floating toolbox implementation so it remains recoverable in-repo while the live inspector is rebuilt in stages.

Rules:

- Treat these files as read-only reference snapshots.
- Do not reintroduce them into the default app path.
- If the old shell ever needs to be mounted for comparison, do it behind an explicit debug-only import.
