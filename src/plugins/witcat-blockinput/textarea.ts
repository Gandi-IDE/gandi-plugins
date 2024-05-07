import styles from "./styles.less";

export function createBlockTextareaElement(
  title: string,
  defaultValue: string,
  value: string,
  onChange: (value: string) => void,
  textAlign = "left",
) {
  let textareaWrapper = document.createElement("section");
  textareaWrapper.className = styles.textareaWrapper;
  const header = document.createElement("div");
  header.className = styles.header;
  header.innerText = title;
  textareaWrapper.appendChild(header);
  const body = document.createElement("div");
  body.className = styles.body;
  const textarea = document.createElement("textarea");
  textarea.className = styles.textarea;
  textarea.style.textAlign = textAlign;
  textarea.value = value;
  const inputCompile = () => {
    onChange(textarea.value);
    textareaWrapper.remove();
    textareaWrapper = null;
  };
  textarea.addEventListener("keydown", function (e) {
    if (e.code === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const cursorPos = this.selectionStart;
      const textBeforeCursor = this.value.substring(0, cursorPos);
      const textAfterCursor = this.value.substring(cursorPos, this.value.length);
      this.value = textBeforeCursor + "\n" + textAfterCursor;
      this.setSelectionRange(cursorPos + 1, cursorPos + 1);
    } else if (e.code === "Enter") {
      e.preventDefault();
      this.blur();
    } else if (e.code === "Escape") {
      textarea.removeEventListener("blur", inputCompile);
      onChange(defaultValue);
      textareaWrapper.remove();
      textareaWrapper = null;
    }
  });
  textarea.addEventListener("blur", inputCompile);
  textarea.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  body.appendChild(textarea);
  textareaWrapper.appendChild(body);
  document.body.appendChild(textareaWrapper);
  textarea.focus();
}
