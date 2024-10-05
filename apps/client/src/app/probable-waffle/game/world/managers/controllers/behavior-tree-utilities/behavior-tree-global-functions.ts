export function getStringValue(promptText: string) {
  return window.prompt(promptText);
}

export function getNumberValue(promptText: string) {
  return parseFloat(window.prompt(promptText) as string);
}

export function getBooleanValue(promptText: string) {
  return window.confirm(`${promptText}. (Ok=true Cancel=false)`);
}

export function showErrorToast(errorMessage: string) {
  return window.alert(errorMessage);
}

export function showInfoToast(infoMessage: string) {
  return window.alert(infoMessage);
}
