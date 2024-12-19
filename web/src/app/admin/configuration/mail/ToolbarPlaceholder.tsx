import React, { useState } from "react";
import PropTypes from "prop-types";
import { EditorState, Modifier } from "draft-js";

interface Props {
  editorState: EditorState;
  onChange?: (args: any) => any;
}

const ModToolbarPlaceholder = ({ editorState, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const openPlaceholderDropdown = () => setOpen((prevState) => !prevState);

  const addPlaceholder = (placeholder: any) => {
    const contentState = Modifier.replaceText(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      placeholder,
      editorState.getCurrentInlineStyle()
    );
    onChange &&
      onChange(
        EditorState.push(editorState, contentState, "insert-characters")
      );
  };

  const placeholderOptions = [
    { key: "Email", value: "{{email}}", text: "Email" },
    { key: "Full Name", value: "{{full_name}}", text: "Full Name" },
    { key: "Signup Link", value: "{{signup_link}}", text: "Signup Link" },
  ];

  const listItems = placeholderOptions.map((item) => (
    <li
      key={item.key}
      onClick={() => addPlaceholder(item.value)}
      className="rdw-dropdownoption-default placeholder-li"
    >
      {item.text}
    </li>
  ));

  return (
    <div
      onClick={openPlaceholderDropdown}
      className="rdw-block-wrapper"
      aria-label="rdw-block-control"
    >
      <div
        className="rdw-dropdown-wrapper rdw-block-dropdown"
        aria-label="rdw-dropdown"
      >
        <div className="rdw-dropdown-selectedtext" title="Placeholders">
          <span>Tokens</span>
          <div className={`rdw-dropdown-caretto${open ? "close" : "open"}`} />
        </div>
        <ul
          className={`rdw-dropdown-optionwrapper ${open ? "" : "placeholder-ul"}`}
        >
          {listItems}
        </ul>
      </div>
    </div>
  );
};

export default ModToolbarPlaceholder;
