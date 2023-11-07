import type { HLJSApi } from "https://esm.sh/v133/highlight.js@11.9.0";
import hljs_ from "https://esm.sh/v133/highlight.js@11.9.0";
import themes from "./themes.json" assert { type: "json" };

const hljs = hljs_ as HLJSApi;
const cssBasePath = "https://esm.sh/v133/highlight.js@11.9.0/styles/";

const elem = {
  language: document.getElementById("language") as HTMLSelectElement,
  output: document.getElementById("output") as HTMLPreElement,
  theme: document.getElementById("theme") as HTMLSelectElement,
  code: document.getElementById("code") as HTMLTextAreaElement,
  copy: document.getElementById("copy") as HTMLButtonElement,
};

function initialize() {
  /*
   * Initialize theme preferences
   */

  themes.forEach((theme) => {
    const option = createOption(theme);
    elem.theme.appendChild(option);
  });

  const updateTheme = () => {
    localStorage.setItem("theme", elem.theme.value);

    let stylesheet = document.getElementById("hljs-stylesheet") as HTMLLinkElement;
    if (!stylesheet) {
      stylesheet = document.createElement("link");
      stylesheet.id = "hljs-stylesheet";
      stylesheet.rel = "stylesheet";
      document.head.appendChild(stylesheet);
    }

    const cssURL = `${cssBasePath}${elem.theme.value}.css`;
    stylesheet.href = cssURL;
  };

  elem.theme.addEventListener("change", updateTheme);

  // Restore theme default.
  const defaultTheme = localStorage.getItem("theme") || "default";
  elem.theme.value = defaultTheme;
  updateTheme();

  /*
   * Initialize languages
   */

  const insertLanguage = (language: string) => elem.language.appendChild(createOption(language));
  insertLanguage("*");
  hljs.listLanguages().forEach((language) => insertLanguage(language));

  /*
   * Initialize highlighter
   */

  let language: string | undefined;

  const update = () => {
    const result = hljs.highlightAuto(
      elem.code.value,
      language ? [language] : undefined,
    );
    elem.output.innerHTML = result.value;
  };

  elem.code.addEventListener("input", () => {
    localStorage.setItem("code", elem.code.value);
    elem.output.textContent = elem.code.value;
    update();
  });

  // Restore code default.
  const defaultCode = localStorage.getItem("code") || "";
  elem.code.value = defaultCode;
  update();

  elem.language.addEventListener("change", () => {
    if (elem.language.value == "*") {
      language = undefined;
    } else {
      language = elem.language.value;
    }
    update();
  });

  /*
   * Initialize copy button
   */

  elem.copy.addEventListener("click", () => {
    const selection = window.getSelection();

    cloneStyledElement(elem.output, (e) => {
      const range = document.createRange();
      range.selectNodeContents(e);

      selection.removeAllRanges();
      selection.addRange(range);

      document.execCommand("copy");
      selection.removeAllRanges();
    });

    elem.copy.textContent = "Copied!";
    setTimeout(() => {
      elem.copy.textContent = "Copy";
    }, 2000);
  });
}

// cloneStyledElement clones an element and its styles. The returning element
// will have all its styles inlined.
function cloneStyledElement(element: HTMLElement, use: (_: HTMLElement) => void) {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = "";
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "-9999px";
  clone.style.fontSize = "inherit";
  clone.style.fontWeight = "inherit";
  clone.style.lineHeight = "inherit";

  document.body.appendChild(clone);

  const descendants = descendantNodes(clone);

  for (let descendant of descendants) {
    if (descendant instanceof Text) {
      // Convert text nodes to spans so that they can be styled.
      const span = document.createElement("span");
      span.textContent = descendant.textContent;
      descendant.replaceWith(span);
      descendant = span;
    }
    if (descendant instanceof HTMLElement) {
      const style = window.getComputedStyle(descendant);
      for (const prop of style) {
        descendant.style.setProperty(prop, style.getPropertyValue(prop));
      }
    }
  }

  for (let descendant of descendants) {
    if (descendant instanceof HTMLElement) {
      descendant.id = "";
      descendant.className = "";
    }
  }

  use(clone);
  document.body.removeChild(clone);
}

function descendantNodes(node, all: Node[] = []): Node[] {
  all.push(...node.childNodes);
  for (const child of node.childNodes) {
    descendantNodes(child, all);
  }
  return all;
}

function createOption(value: string): HTMLOptionElement {
  const option = document.createElement("option");
  option.value = value;
  option.text = value;
  return option;
}

initialize();
