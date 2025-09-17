// Simple module to manage pending action state across the chat flow

let pendingAction = null;

export function setPendingAction(action) {
  pendingAction = action;
}

export function getPendingAction() {
  return pendingAction;
}

export function clearPendingAction() {
  pendingAction = null;
}
