import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppRole, ProfileWithRole } from "@/types/database";

interface ChangeRoleDialogProps {
  user: ProfileWithRole | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string, role: AppRole) => void;
  isPending: boolean;
}

export function ChangeRoleDialog({ user, isOpen, onClose, onConfirm, isPending }: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);

  if (!user) return null;

  const handleConfirm = () => {
    if (selectedRole) {
      onConfirm(user.id, selectedRole);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thay đổi vai trò cho {user.full_name || user.email}</DialogTitle>
          <DialogDescription>
            Chọn một vai trò mới cho người dùng này. Hành động này sẽ thay đổi quyền truy cập của họ.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select onValueChange={(value: AppRole) => setSelectedRole(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn vai trò mới" />
            </SelectTrigger>
            <SelectContent>
              {(['user', 'moderator', 'admin'] as AppRole[]).map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleConfirm} disabled={isPending || !selectedRole}>
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}