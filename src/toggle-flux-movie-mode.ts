import { closeMainWindow, showToast } from "@raycast/api";
import { COLOR_EFFECT_MOVIE_MODE, getMenuState, setColorEffect } from "./flux-api";
import { DEFAULT_ERROR_TOAST } from "./constants";

export default async function ToggleFluxDarkroom() {
  await closeMainWindow();

  const currEnabled = await getMenuState(COLOR_EFFECT_MOVIE_MODE);
  const success = await setColorEffect("Movie mode");

  await showToast(
    success ? { title: `f.lux movie mode ${currEnabled ? "disabled" : "enabled"}` } : DEFAULT_ERROR_TOAST,
  );
}
