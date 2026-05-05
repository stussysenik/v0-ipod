// Inline editable text field for song metadata
// Double-click to edit, Enter/blur to save, Escape to cancel

open Types

@react.component
let make = (~field, ~value, ~dispatch, ~event) => {
  let (editing, setEditing) = React.useState(() => false)
  let (editValue, setEditValue) = React.useState(() => value)
  let _inputRef = React.useRef(Nullable.null)

  let startEditing = () => {
    setEditValue(_ => value)
    setEditing(_ => true)
  }

  let save = () => {
    if editing {
      dispatch(event(editValue))
      setEditing(_ => false)
    }
  }

  let cancel = () => {
    setEditValue(_ => value)
    setEditing(_ => false)
  }

  let onKeyDown = (e: ReactEvent.Keyboard.t) => {
    if ReactEvent.Keyboard.key(e) == "Enter" {
      ReactEvent.Keyboard.preventDefault(e)
      save()
    } else if ReactEvent.Keyboard.key(e) == "Escape" {
      cancel()
    }
  }

  if editing {
    <input
      type_="text"
      value=editValue
      onChange={e => {
        let target = ReactEvent.Form.target(e)
        setEditValue(_ => target["value"])
      }}
      onBlur={_ => save()}
      onKeyDown
      autoFocus=true
      className="editor-input"
    />
  } else {
    <span className="editor-display" title={"Double-click to edit " ++ field} onDoubleClick={_ => startEditing()}>
      {React.string(value)}
    </span>
  }
}
