import React from 'react';

interface EmbedHelperProps {
  children: React.ReactNode;
}

/**
 * Helper component that provides utilities for embedded contexts
 */
export const EmbedHelper: React.FC<EmbedHelperProps> = ({ children }) => {
  const [isEmbedded, setIsEmbedded] = React.useState(false);

  React.useEffect(() => {
    try {
      setIsEmbedded(window.self !== window.top);
    } catch (e) {
      setIsEmbedded(true);
    }
  }, []);

  // Provide context about embedding status
  return (
    <div data-embedded={isEmbedded} className={isEmbedded ? 'embedded-mode' : 'standalone-mode'}>
      {children}
    </div>
  );
};

/**
 * Hook to detect if the app is running in an embedded context
 */
export const useEmbedded = () => {
  const [isEmbedded, setIsEmbedded] = React.useState(false);

  React.useEffect(() => {
    try {
      setIsEmbedded(window.self !== window.top);
    } catch (e) {
      setIsEmbedded(true);
    }
  }, []);

  return isEmbedded;
};

/**
 * Hook for parent-child communication in embedded contexts
 */
export const useParentCommunication = () => {
  const sendToParent = React.useCallback((message: any) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
    }
  }, []);

  const requestResize = React.useCallback(() => {
    const height = document.documentElement.scrollHeight;
    sendToParent({
      type: 'RESIZE_REQUEST',
      height: height
    });
  }, [sendToParent]);

  return { sendToParent, requestResize };
};

export default EmbedHelper;