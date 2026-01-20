import { runAppleScript } from "@raycast/utils";

type TopLevel = "About f.lux" | "f.lux is off" | "Preferences..." | "Quit f.lux";
type ActionOption = "Disable" | "Color Effects" | "Options";
export type DisableDuration = "for an hour" | "until sunrise" | "for full-screen apps" | "for current app";
export type ColorEffect = "Darkroom" | "Movie mode" | "macOS Dark theme at sunset";
export type OptionsAction =
  | "Fast transitions"
  | "Sleep in on weekends"
  | "Expanded daytime settings"
  | "Dim on disable"
  | "Notifications from f.lux website"
  | "Backwards alarm clock";

type MenuSpec = TopLevel | ["Options", OptionsAction] | ["Color Effects", ColorEffect] | ["Disable", DisableDuration];

/**
 * Strip quotes from a string
 *
 * @param str
 */
function nq(str: string) {
  return str.replaceAll('"', "");
}

function scpt_fluxScope(body: string) {
  return `
    tell application "System Events"
      try
        tell application process "Flux"
          ${body}
        end tell
      on error
        return 1
      end try
    end tell
  `;
}

function scpt_menuHelper(name: string) {
  return `menu item "${name}" of menu 1 of menu bar item 1 of menu bar 2`;
}

function scpt_subMenuHelper(parentMenu: string, childMenu: string) {
  return `menu item "${childMenu}" of menu 1 of menu item "${parentMenu}" of menu 1 of menu bar item 1 of menu bar 2`;
}

const scpt_getMenuCheckedHelper = () => `
  on getMenuCheckedStates(menuSpecs)
    tell application "System Events"
      tell application process "Flux"
        set results to {}
        
        repeat with spec in menuSpecs
          try
            if (count of spec) is 1 then
              set mi to ${nq(scpt_menuHelper("item 1 of spec"))}
            else
              set mi to ${nq(scpt_subMenuHelper("item 1 of spec", "item 2 of spec"))}
            end if
              
            set markChar to value of attribute "AXMenuItemMarkChar" of mi
            
            if markChar is "✓" then
              set end of results to 1
            else
              set end of results to 0
            end if
          on error
            set end of results to -1
          end try
        end repeat
        
        set AppleScript's text item delimiters to ","
        set resultString to results as text
        set AppleScript's text item delimiters to ""
        
        return resultString        
      end tell
    end tell
  end getMenuCheckedStates
`;

function scpt_clickTopMenu(action: TopLevel) {
  return scpt_fluxScope(`
    click ${scpt_menuHelper(action)}
    return 0
  `);
}

function scpt_clickSubMenu(action: ActionOption, secondAction: ColorEffect | DisableDuration | OptionsAction) {
  return scpt_fluxScope(`
    click ${scpt_subMenuHelper(action, secondAction)}

    return 0
  `);
}

async function as_clickMenu(action: MenuSpec) {
  return (
    (await runAppleScript(
      typeof action === "string" ? scpt_clickTopMenu(action) : scpt_clickSubMenu(action[0], action[1]),
    )) === "0"
  );
}

export async function getMenuStates() {
  const menuSpecs: MenuSpec[] = [
    ["Options", "Fast transitions"],
    ["Options", "Sleep in on weekends"],
    ["Options", "Expanded daytime settings"],
    ["Options", "Dim on disable"],
    ["Options", "Notifications from f.lux website"],
    ["Options", "Backwards alarm clock"],
    ["Color Effects", "Darkroom"],
    ["Color Effects", "Movie mode"],
    ["Color Effects", "macOS Dark theme at sunset"],
    ["Disable", "for an hour"],
    ["Disable", "until sunrise"],
    ["Disable", "for full-screen apps"],
  ];
  const options = new Map<MenuSpec, number>();
  const states = (
    await runAppleScript(`
      ${scpt_getMenuCheckedHelper()}
      
      return getMenuCheckedStates({
         ${menuSpecs.map((menuSpec, index) => {
           return `{"${Array.isArray(menuSpec) ? menuSpec.join('","') : menuSpec}"}${index < menuSpecs.length - 1 ? "," : ""}`;
         })}
      })
    `)
  ).split(",");

  menuSpecs.forEach((menuSpec, index) => {
    options.set(menuSpec, parseInt(states[index], 10));
  });

  return options;
}

export async function openPreferences(): Promise<boolean> {
  return await as_clickMenu("Preferences...");
}

export async function toggleOption(option: OptionsAction): Promise<boolean> {
  return await as_clickMenu(["Options", option]);
}

export async function setColorEffect(effect: ColorEffect): Promise<boolean> {
  return await as_clickMenu(["Color Effects", effect]);
}

export async function disableFluxForDuration(duration: DisableDuration): Promise<boolean> {
  return await as_clickMenu(["Disable", duration]);
}

export async function quitFlux(): Promise<boolean> {
  return await as_clickMenu("Quit f.lux");
}
