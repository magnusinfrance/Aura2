import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const SoundCloudCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (code) {
      // Send the code back to the parent window
      window.opener?.postMessage({
        type: 'soundcloud-callback',
        code: code,
      }, window.location.origin);
    } else if (error) {
      // Send error back to parent window
      window.opener?.postMessage({
        type: 'soundcloud-error',
        error: error,
      }, window.location.origin);
    }

    // Close the popup
    window.close();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Connecting to SoundCloud...</p>
        <p className="text-sm mt-2">This window will close automatically.</p>
      </div>
    </div>
  );
};

export default SoundCloudCallback;