## ADDED Requirements

### Requirement: Local WebSocket Server Mediates Code And Figma
The project SHALL run a local WebSocket server at `ws://localhost:7733/figma-hmr` started by `scripts/figma-hmr-server.ts`. The server SHALL accept at most one Figma plugin connection at a time and SHALL log connection state, render events, and errors with color-coded output.

#### Scenario: Starting The HMR Server
- **GIVEN** a developer runs `bun run figma:dev`
- **WHEN** the script initializes
- **THEN** the HMR server SHALL bind to port 7733
- **AND** the server SHALL print the endpoint URL and a waiting message to the console

#### Scenario: A Second Plugin Connection Is Rejected
- **GIVEN** one Figma plugin instance is already connected to the HMR server
- **WHEN** a second plugin instance attempts to connect
- **THEN** the server SHALL reject the second connection with a clear reason
- **AND** the first connection SHALL remain intact

### Requirement: File Changes Trigger A Satori Re-Render
The HMR server SHALL own a chokidar watcher over `components/**` and `stories/**`. On any file change the server SHALL identify the affected story ids, re-render them via `scripts/render-story.ts`, and emit a `story-updated` message on the WebSocket with the new SVG payload. Re-renders SHALL be debounced per story id with a 300 millisecond window.

#### Scenario: Saving A Component Triggers A Render
- **GIVEN** the HMR server is running and a plugin is connected
- **WHEN** a developer saves `components/ipod/click-wheel.tsx`
- **THEN** the watcher SHALL identify every story whose component file matches
- **AND** the server SHALL emit a `story-updated` message for each affected story
- **AND** each message's payload SHALL include the story id and a fresh SVG string from satori

#### Scenario: Rapid Saves Are Debounced
- **GIVEN** a developer saves the same file five times within 300 milliseconds
- **WHEN** the debounce window closes
- **THEN** the server SHALL emit exactly one `story-updated` message per story id
- **AND** the emitted render SHALL reflect the final state of the file

### Requirement: Stable Story Binding Via Plugin Data
Each Figma frame backed by a story SHALL carry its story id in Figma plugin data at the key `storyId`. The custom Figma plugin SHALL use this key to locate the frame to update on every `story-updated` message. Rebinding SHALL be possible through a plugin UI action on any selected frame.

#### Scenario: A Story Update Targets The Correct Frame
- **GIVEN** a frame on `iPod / Wheel` has plugin data `storyId=click-wheel--default`
- **WHEN** the plugin receives a `story-updated` message for `click-wheel--default`
- **THEN** the plugin SHALL locate that frame by its plugin data
- **AND** the plugin SHALL update the frame's interior with the new SVG content
- **AND** the plugin SHALL NOT modify any other frame

#### Scenario: Rebinding A Frame To A Different Story
- **GIVEN** a developer has selected an unbound frame in the canonical file
- **WHEN** they use the plugin UI to bind it to `ipod-screen--menu`
- **THEN** the plugin SHALL write `storyId=ipod-screen--menu` to the frame's plugin data
- **AND** the next `story-updated` message for `ipod-screen--menu` SHALL update that frame

### Requirement: Updates Preserve Frame Geometry And Layout
Updates SHALL replace only the interior vector children of the bound frame. The frame's own position, size constraints, parent, auto-layout settings, padding, and resize rules SHALL be preserved across updates.

#### Scenario: Updating A Frame Inside An Auto-Layout Parent
- **GIVEN** a bound frame is a child of an auto-layout container
- **WHEN** a `story-updated` message arrives for that frame
- **THEN** the frame's position inside the auto-layout SHALL be preserved
- **AND** the frame's fill, stroke, and effects SHALL be preserved
- **AND** only the frame's interior children SHALL be replaced

#### Scenario: Designer Repositioning Survives An Update
- **GIVEN** a designer has moved a bound frame by hand to a new position
- **WHEN** the next `story-updated` message arrives for that frame
- **THEN** the frame SHALL remain at the designer's new position
- **AND** only its interior children SHALL be updated

### Requirement: Token Round-Trip From Figma Back Into The Working Tree
The plugin SHALL listen for Figma `documentchange` events filtered to Variables in the `Primitives` and `Semantic` collections. Changes SHALL be emitted to the HMR server as `token-changed` messages. The HMR server SHALL route each change to a token writer that updates `app/globals.css` or `tailwind.config.ts` appropriately. Writes SHALL be debounced at 500 milliseconds per token.

#### Scenario: Editing A Semantic Color In Figma
- **GIVEN** a designer edits the light-mode value of `surface.primary` in the canonical Figma file
- **WHEN** the plugin detects the Variable change
- **THEN** the plugin SHALL emit a `token-changed` message identifying the collection, variable name, mode, and new value
- **AND** the HMR server SHALL write the new value into the light-mode rule in `app/globals.css`
- **AND** the Next.js dev server SHALL hot reload the affected components

#### Scenario: Dragging A Slider Produces At Most One Write Per Debounce Window
- **GIVEN** a designer scrubs a color Variable slider in Figma
- **WHEN** twenty `documentchange` events fire within 500 milliseconds
- **THEN** the plugin SHALL emit up to twenty `token-changed` messages
- **AND** the token writer SHALL collapse them to exactly one file write containing the final value

#### Scenario: Figma Edits Are Traceable In Git Blame
- **GIVEN** the token writer has written a Figma-originated change into `app/globals.css`
- **WHEN** a developer runs `git blame` on the changed line
- **THEN** the blame line SHALL include the marker `[figma-hmr]`
- **AND** the developer SHALL be able to distinguish Figma-originated edits from code-originated edits

### Requirement: Round-Trip Scope Is Tokens Only
The round-trip path SHALL NOT attempt to translate arbitrary Figma geometry changes back into code. Figma edits that move, resize, restyle, or reparent frames SHALL remain local to Figma and SHALL NOT produce file writes.

#### Scenario: A Frame Move In Figma Does Not Touch Code
- **GIVEN** a designer moves a bound frame by 24 pixels in Figma
- **WHEN** the plugin observes the position change
- **THEN** no `token-changed` message SHALL be emitted
- **AND** no file SHALL be written
- **AND** the move SHALL remain a local Figma edit only

### Requirement: Graceful Failure On Disconnect, Render Error, And Conflict
If the WebSocket connection drops, the plugin SHALL show a disconnected indicator and SHALL disable all write operations until reconnected. If `scripts/render-story.ts` throws on any story, the server SHALL emit a `story-error` message and the plugin SHALL show the error in the UI without modifying the bound frame. If the token writer is unable to parse a target file, the writer SHALL abort and leave the file unchanged. No failure mode SHALL result in a partially updated frame or partially written file.

#### Scenario: The Dev Server Crashes While The Plugin Is Connected
- **GIVEN** a plugin is connected and showing live updates
- **WHEN** the dev server crashes
- **THEN** the plugin SHALL detect the WebSocket close
- **AND** the plugin UI SHALL show a `Disconnected` state
- **AND** the plugin SHALL NOT modify any frame until reconnection

#### Scenario: A Story Throws During Render
- **GIVEN** a developer has introduced a syntax error in a story file
- **WHEN** the HMR server attempts to render that story
- **THEN** the server SHALL emit a `story-error` message for the affected story id
- **AND** the plugin SHALL show the error in its console
- **AND** the last successful render for that story SHALL remain in place in Figma

#### Scenario: Token Writer Finds A Conflicting Edit
- **GIVEN** the token writer is about to apply a Figma-originated edit to `app/globals.css`
- **WHEN** the file's content has changed in a way that makes the target line ambiguous
- **THEN** the writer SHALL abort the write with a descriptive error
- **AND** the server SHALL surface the error in both its own console and the plugin UI

### Requirement: Single-Command Dev Entry Point
The project SHALL provide a `bun run figma:dev` script that starts the Next.js dev server, the HMR WebSocket server, the chokidar watcher, and the token sync watcher in a single process with coloured log output that distinguishes story, token, and error events.

#### Scenario: Running The Dev Entry Point
- **GIVEN** a developer runs `bun run figma:dev`
- **WHEN** the script starts up
- **THEN** Next.js dev, the HMR server, and the file watchers SHALL all be running under one process
- **AND** the console output SHALL clearly label `[next]`, `[hmr]`, and `[tokens]` messages

#### Scenario: Shutting Down Cleanly
- **GIVEN** `bun run figma:dev` is running
- **WHEN** the developer sends a SIGINT
- **THEN** the HMR WebSocket server, file watchers, and Next.js dev server SHALL all shut down within two seconds
- **AND** no orphan child process SHALL remain

### Requirement: Plugin Maintains A Rollback Snapshot Stack
The custom Figma plugin SHALL maintain an in-memory snapshot of the last ten updates per bound frame. A plugin UI `Undo Restore` button SHALL restore the most recent snapshot for the currently selected frame. The snapshot stack SHALL be per session and SHALL not persist across plugin restarts.

#### Scenario: Restoring A Previous Render
- **GIVEN** a frame has received at least one HMR update this session
- **WHEN** a designer selects that frame and clicks `Undo Restore` in the plugin
- **THEN** the frame's interior SHALL revert to the previous render
- **AND** the snapshot stack depth SHALL decrease by one

#### Scenario: Snapshot Stack Does Not Persist
- **GIVEN** a developer closes the plugin window with a populated snapshot stack
- **WHEN** they reopen the plugin in a new session
- **THEN** the snapshot stack SHALL be empty
- **AND** the `Undo Restore` button SHALL be disabled until at least one new update arrives
