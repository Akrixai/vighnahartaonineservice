import toast from 'react-hot-toast';

// Professional toast notification system
export const showToast = {
  // Success notifications
  success: (message: string, options?: { duration?: number; description?: string }) => {
    return toast.success(message, {
      duration: options?.duration || 4000,
      style: {
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        fontWeight: '600',
      },
      icon: '✅',
    });
  },

  // Error notifications
  error: (message: string, options?: { duration?: number; description?: string }) => {
    const fullMessage = options?.description ? `${message}\n${options.description}` : message;
    return toast.error(fullMessage, {
      duration: options?.duration || 6000,
      style: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        fontWeight: '600',
        whiteSpace: 'pre-line' as const,
      },
      icon: '❌',
    });
  },

  // Warning notifications
  warning: (message: string, options?: { duration?: number; description?: string }) => {
    const fullMessage = options?.description ? `${message}\n${options.description}` : message;
    return toast(fullMessage, {
      duration: options?.duration || 5000,
      style: {
        background: '#fffbeb',
        border: '1px solid #fed7aa',
        color: '#92400e',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        fontWeight: '600',
        whiteSpace: 'pre-line' as const,
      },
      icon: '⚠️',
    });
  },

  // Info notifications
  info: (message: string, options?: { duration?: number; description?: string }) => {
    const fullMessage = options?.description ? `${message}\n${options.description}` : message;
    return toast(fullMessage, {
      duration: options?.duration || 4000,
      style: {
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1e40af',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        fontWeight: '600',
        whiteSpace: 'pre-line' as const,
      },
      icon: 'ℹ️',
    });
  },

  // Loading notifications
  loading: (message: string, options?: { description?: string }) => {
    const fullMessage = options?.description ? `${message}\n${options.description}` : message;
    return toast.loading(fullMessage, {
      style: {
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1e40af',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        fontWeight: '600',
        whiteSpace: 'pre-line' as const,
      },
    });
  },

  // Custom notifications with actions
  custom: (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info',
    options?: {
      duration?: number;
      description?: string;
      action?: { label: string; onClick: () => void };
    }
  ) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    const styles = {
      success: {
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534',
      },
      error: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b',
      },
      warning: {
        background: '#fffbeb',
        border: '1px solid #fed7aa',
        color: '#92400e',
      },
      info: {
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1e40af',
      },
    };

    const fullMessage = options?.description ? `${message}\n${options.description}` : message;

    const toastId = toast(fullMessage, {
      duration: options?.duration || 5000,
      style: {
        ...styles[type],
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        fontWeight: '600',
        whiteSpace: 'pre-line' as const,
      },
      icon: icons[type],
    });

    // If there's an action, show a separate action toast with custom styling
    if (options?.action) {
      setTimeout(() => {
        // Create a more professional confirmation toast
        const confirmToast = toast(
          (t) => (
            `${message}\n${options.description || ''}\n\nClick the button below to ${options.action!.label.toLowerCase()}`
          ),
          {
            duration: 10000, // Longer duration for action toasts
            style: {
              ...styles[type],
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              fontWeight: '600',
              whiteSpace: 'pre-line' as const,
              minWidth: '300px',
            },
            icon: '⚠️',
          }
        );

        // Add action buttons via a separate toast
        setTimeout(() => {
          const actionToast = toast(
            (t) => (
              `Confirm: ${options.action!.label}?`
            ),
            {
              duration: 8000,
              style: {
                background: '#f3f4f6',
                border: '2px solid #d1d5db',
                color: '#374151',
                borderRadius: '12px',
                padding: '16px',
                fontWeight: '600',
              },
              icon: '❓',
            }
          );

          // Create interactive confirmation toast with buttons
          const interactiveToast = toast(
            (t) => (
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">❓</span>
                  <span className="font-semibold">Confirm Action</span>
                </div>
                <p className="text-sm">{`${message}\n${options.description || ''}`}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      toast.dismiss(confirmToast);
                      toast.dismiss(actionToast);
                      toast.dismiss(t.id);
                      options.action!.onClick();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    {options.action!.label}
                  </button>
                  <button
                    onClick={() => {
                      toast.dismiss(confirmToast);
                      toast.dismiss(actionToast);
                      toast.dismiss(t.id);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ),
            {
              duration: 15000,
              style: {
                background: '#fffbeb',
                border: '2px solid #f59e0b',
                color: '#92400e',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                minWidth: '350px',
              },
            }
          );
        }, 500);
      }, 100);
    }

    return toastId;
  },

  // Confirmation notifications
  confirm: (
    message: string,
    options?: {
      duration?: number;
      description?: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    }
  ) => {
    const confirmToast = toast(
      (t) => (
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">❓</span>
            <span className="font-semibold">{message}</span>
          </div>
          {options?.description && (
            <p className="text-sm text-gray-600">{options.description}</p>
          )}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                if (options?.onConfirm) {
                  options.onConfirm();
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                if (options?.onCancel) {
                  options.onCancel();
                }
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: options?.duration || 15000,
        style: {
          background: '#fffbeb',
          border: '2px solid #f59e0b',
          color: '#92400e',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          minWidth: '350px',
        },
      }
    );

    return confirmToast;
  },

  // Input prompt notifications
  prompt: (
    message: string,
    options?: {
      duration?: number;
      description?: string;
      placeholder?: string;
      onSubmit?: (value: string) => void;
      onCancel?: () => void;
    }
  ) => {
    let inputValue = '';

    const promptToast = toast(
      (t) => (
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">✏️</span>
            <span className="font-semibold">{message}</span>
          </div>
          {options?.description && (
            <p className="text-sm text-gray-600">{options.description}</p>
          )}
          <input
            type="text"
            placeholder={options?.placeholder || 'Enter value...'}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => { inputValue = e.target.value; }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                toast.dismiss(t.id);
                if (options?.onSubmit && inputValue.trim()) {
                  options.onSubmit(inputValue.trim());
                }
              }
            }}
            autoFocus
          />
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                if (options?.onSubmit && inputValue.trim()) {
                  options.onSubmit(inputValue.trim());
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Submit
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                if (options?.onCancel) {
                  options.onCancel();
                }
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: options?.duration || 20000,
        style: {
          background: '#eff6ff',
          border: '2px solid #3b82f6',
          color: '#1e40af',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          minWidth: '350px',
        },
      }
    );

    return promptToast;
  },

  // Promise-based notifications
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: { description?: string }
  ) => {
    const loadingMessage = options?.description ? `${messages.loading}\n${options.description}` : messages.loading;

    return toast.promise(
      promise,
      {
        loading: loadingMessage,
        success: (data) => {
          const successMsg = typeof messages.success === 'function' ? messages.success(data) : messages.success;
          return successMsg;
        },
        error: (error) => {
          const errorMsg = typeof messages.error === 'function' ? messages.error(error) : messages.error;
          return errorMsg;
        },
      },
      {
        style: {
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          fontWeight: '600',
          whiteSpace: 'pre-line' as const,
        },
        success: {
          icon: '✅',
          style: {
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
          },
        },
        error: {
          icon: '❌',
          style: {
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
          },
        },
      }
    );
  },

  // Dismiss all toasts
  dismiss: () => toast.dismiss(),

  // Remove specific toast
  remove: (toastId: string) => toast.dismiss(toastId),
};
