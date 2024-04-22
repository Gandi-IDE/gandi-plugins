export default class XML {
  xmlDoc = document.implementation.createDocument(null, "xml");

  newXml(root: HTMLElement, tagName: string, attrs: Record<string, string>) {
    const element = this.xmlDoc.createElement(tagName);
    root.appendChild(element);
    return this.setAttr(element, attrs);
  }

  setAttr(root: HTMLElement, attrs: Record<string, string>) {
    if (attrs) {
      for (const key of Object.keys(attrs)) {
        if (key === "text") {
          root.appendChild(this.xmlDoc.createTextNode(attrs[key]));
        } else {
          root.setAttribute(key, attrs[key]);
        }
      }
    }
    return root;
  }
}
