import { enUSGreetDataset } from "@/lib/kotodoki/greet/en-US";
import { jaJPGreetDataset } from "@/lib/kotodoki/greet/ja-JP";

export { enUSGreetDataset } from "@/lib/kotodoki/greet/en-US";
export { jaJPGreetDataset } from "@/lib/kotodoki/greet/ja-JP";

export const greetDatasets = [jaJPGreetDataset, enUSGreetDataset] as const;
