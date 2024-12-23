"use client";

import React, { useEffect, useState } from "react";
import { EditorState, Modifier } from "draft-js";

interface Props {
  editorState: EditorState;
  dropdownType?: "invite" | "verify" | "passreset" | "2fa";
  onChange?: (args: any) => any;
}

const ModToolbarPlaceholder = ({
  dropdownType,
  editorState,
  onChange,
}: Props) => {
  const [open, setOpen] = useState(false);
  const openPlaceholderDropdown = () => setOpen((prevState) => !prevState);
  const [placeHolderOptions, setPlaceHolderOptions] = useState<any[]>([]);

  useEffect(() => {
    switch (dropdownType) {
      case "invite":
        return setPlaceHolderOptions([
          { key: "Signup Link", value: "{{signup_link}}", text: "Signup Link" },
        ]);

      case "verify":
        return setPlaceHolderOptions([
          { key: "Full Name", value: "{{full_name}}", text: "Full Name" },
          { key: "Verify URL", value: "{{verify_url}}", text: "Verify URL" },
        ]);

      case "passreset":
        return setPlaceHolderOptions([
          { key: "Email", value: "{{email}}", text: "Email" },
          { key: "Reset URL", value: "{{reset_url}}", text: "Reset URL" },
        ]);

      case "2fa":
        return setPlaceHolderOptions([
          { key: "Full Name", value: "{{full_name}}", text: "Full Name" },
          { key: "2FA Code", value: "{{code}}", text: "2FA Code" },
        ]);

      default:
        return setPlaceHolderOptions([
          { key: "Email", value: "{{email}}", text: "Email" },
          { key: "Full Name", value: "{{full_name}}", text: "Full Name" },
          { key: "Reset URL", value: "{{reset_url}}", text: "Reset URL" },
          { key: "Signup Link", value: "{{signup_link}}", text: "Signup Link" },
          { key: "Verify URL", value: "{{verify_url}}", text: "Verify URL" },
        ]);
    }
  }, [dropdownType]);

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

  const listItems = placeHolderOptions.map((item) => (
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
