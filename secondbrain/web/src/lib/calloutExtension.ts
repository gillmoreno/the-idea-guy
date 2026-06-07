import { Node, mergeAttributes } from "@tiptap/core";

export type CalloutVariant = "info" | "tip" | "warning" | "success";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (variant?: CalloutVariant) => ReturnType;
      toggleCallout: (variant?: CalloutVariant) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-variant") ?? "info",
        renderHTML: (attrs) => ({ "data-variant": attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const variant = HTMLAttributes["data-variant"] ?? "info";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "true",
        class: `callout callout-${variant}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (variant: CalloutVariant = "info") =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant }),
      toggleCallout:
        (variant: CalloutVariant = "info") =>
        ({ commands }) =>
          commands.toggleWrap(this.name, { variant }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});
