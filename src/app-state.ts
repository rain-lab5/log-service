let ready = false;

export function isReady(): boolean {
  return ready;
}

export function setReady(): void {
  ready = true;
}