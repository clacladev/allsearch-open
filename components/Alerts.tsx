import { toast } from 'sonner';

export const showErrorAlertToast = (title: string, message: string) =>
  toast.error(title, { description: message });

export const showSuccessAlertToast = (title: string, message: string) =>
  toast.success(title, { description: message });
