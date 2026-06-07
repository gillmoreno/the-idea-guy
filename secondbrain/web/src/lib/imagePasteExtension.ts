import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { isImageFile, readImageDataUrl } from "./imageInsert";

/** Paste and drag-drop image files into the editor as inline base64 (local-first). */
export const ImagePasteDrop = Extension.create({
  name: "imagePasteDrop",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste(view, event) {
            const items = [...(event.clipboardData?.items ?? [])];
            const imageItem = items.find((item) => item.type.startsWith("image/"));
            if (!imageItem) return false;

            const file = imageItem.getAsFile();
            if (!file || !isImageFile(file)) return false;

            event.preventDefault();
            void readImageDataUrl(file).then((dataUrl) => {
              if (!dataUrl) return;
              const node = view.state.schema.nodes.image?.create({
                src: dataUrl,
                alt: "Pasted image",
              });
              if (!node) return;
              view.dispatch(view.state.tr.replaceSelectionWith(node));
            });
            return true;
          },

          handleDrop(view, event, _slice, moved) {
            if (moved) return false;
            const files = event.dataTransfer?.files;
            if (!files?.length) return false;
            const file = files[0];
            if (!file || !isImageFile(file)) return false;

            event.preventDefault();
            void readImageDataUrl(file).then((dataUrl) => {
              if (!dataUrl) return;
              const node = view.state.schema.nodes.image?.create({
                src: dataUrl,
                alt: file.name.replace(/\.[^.]+$/, "") || "Image",
              });
              if (!node) return;
              const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
              const pos = coords?.pos ?? view.state.selection.from;
              view.dispatch(view.state.tr.insert(pos, node));
            });
            return true;
          },
        },
      }),
    ];
  },
});
