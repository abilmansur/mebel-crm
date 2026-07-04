import { supabase } from "./supabase";
import { demoMaterials } from "./demoData";

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
}

// При первом входе пользователя у него ещё нет workspace — создаём автоматически
// и засеваем стартовые материалы (ЛДСП/МДФ), чтобы калькулятор сразу работал.
export async function getOrCreateWorkspace(userId: string, workspaceName: string): Promise<Workspace | null> {
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (existing) return existing as Workspace;

  const { data: created, error } = await supabase
    .from("workspaces")
    .insert({ name: workspaceName, owner_id: userId })
    .select()
    .single();

  if (error || !created) {
    console.error("Не удалось создать workspace:", error);
    return null;
  }

  const materialsToInsert = demoMaterials.map(({ id, ...rest }) => ({
    ...rest,
    workspace_id: created.id,
  }));
  await supabase.from("materials").insert(materialsToInsert);

  return created as Workspace;
}
