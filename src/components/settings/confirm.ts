import { Alert } from 'react-native';
import { create } from 'zustand';

export type ConfirmOptions = {
  title: string;
  message?: string;
  /** Confirm button label (default "OK"). */
  confirmLabel?: string;
  /** Cancel button label (default "Cancel"). */
  cancelLabel?: string;
  destructive?: boolean;
};

export type PendingConfirm = ConfirmOptions & { id: number; resolve: (ok: boolean) => void };

/**
 * Dialog currently shown by a registered confirm host (Android: a Material 3 `AlertDialog`
 * rendered by the focused `SettingsForm`). Without a host, `confirm` uses the RN `Alert`.
 */
export const useConfirmStore = create<{ pending: PendingConfirm | null }>(() => ({ pending: null }));

let hostCount = 0;
let nextId = 1;

/** Called by a native dialog host while it is focused. Returns the unregister function. */
export function registerConfirmHost(): () => void {
  hostCount += 1;
  return () => {
    hostCount = Math.max(0, hostCount - 1);
    if (hostCount === 0) {
      useConfirmStore.getState().pending?.resolve(false);
      useConfirmStore.setState({ pending: null });
    }
  };
}

/** Settle the pending dialog (used by the host's buttons and dismiss). */
export function settleConfirm(ok: boolean) {
  const pending = useConfirmStore.getState().pending;
  if (!pending) return;
  useConfirmStore.setState({ pending: null });
  pending.resolve(ok);
}

/** Native confirmation dialog. Resolves `true` when the user confirms. */
export function confirm({ title, message, confirmLabel = 'OK', cancelLabel = 'Cancel', destructive }: ConfirmOptions): Promise<boolean> {
  if (hostCount > 0) {
    return new Promise((resolve) => {
      useConfirmStore.getState().pending?.resolve(false);
      useConfirmStore.setState({
        pending: { id: nextId++, title, message, confirmLabel, cancelLabel, destructive, resolve },
      });
    });
  }
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => done(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => done(true) },
      ],
      { cancelable: true, onDismiss: () => done(false) },
    );
  });
}
