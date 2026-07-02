import { createCodePlugin } from "@streamdown/code";
import { cjk } from "@streamdown/cjk";

export const streamdownPlugins = {
  code: createCodePlugin({
    themes: ["vitesse-light", "vitesse-dark"],
  }),
  cjk,
};
