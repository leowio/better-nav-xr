import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@react-three/uikit-default";
import { Text } from "@react-three/uikit";

export function DialogDemo({
  dialogOpen,
  setDialogOpen,
  onCancel,
  onConfirm,
}: {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  onCancel?: () => void;
  onConfirm?: () => void;
}) {
  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text>Confirm or Cancel</Text>
            </DialogTitle>
            <DialogDescription>
              <Text>Either confirm or cancel this test ui</Text>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                onCancel?.();
              }}
              variant="destructive"
            >
              <Text>Cancel</Text>
            </Button>
            <Button
              onClick={() => {
                onConfirm?.();
              }}
            >
              <Text>Confirm</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
