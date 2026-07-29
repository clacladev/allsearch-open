import { AlertFloating } from '@/components/application/alerts/alerts';
import toast from 'react-hot-toast';

export const showCustomToast = (children: React.ReactNode) =>
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-full max-w-md shadow-lg`}>
      {children}
    </div>
  ));

export const showErrorAlertToast = (title: string, message: string) => {
  showCustomToast(
    <AlertFloating color="error" title={title} description={message} confirmLabel="OK" />
  );
};

export const showSuccessAlertToast = (title: string, message: string) => {
  showCustomToast(
    <AlertFloating color="success" title={title} description={message} confirmLabel="OK" />
  );
};
