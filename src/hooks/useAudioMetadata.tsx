import { useCallback } from 'react';

interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  duration?: number;
}

export const useAudioMetadata = () => {
  const extractMetadata = useCallback(async (file: File): Promise<AudioMetadata> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        const metadata: AudioMetadata = {
          duration: audio.duration,
        };
        
        // Try to extract ID3 tags
        extractID3Tags(file).then((id3Data) => {
          resolve({ ...metadata, ...id3Data });
        }).catch(() => {
          resolve(metadata);
        });
        
        URL.revokeObjectURL(objectUrl);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        resolve({});
      });
      
      audio.src = objectUrl;
    });
  }, []);

  const extractID3Tags = async (file: File): Promise<Partial<AudioMetadata>> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const dataView = new DataView(arrayBuffer);
      
      // Check for ID3v2 header
      if (dataView.getUint8(0) === 0x49 && // 'I'
          dataView.getUint8(1) === 0x44 && // 'D'
          dataView.getUint8(2) === 0x33) { // '3'
        
        const version = dataView.getUint8(3);
        const flags = dataView.getUint8(5);
        
        // Calculate tag size
        const size = (dataView.getUint8(6) << 21) |
                    (dataView.getUint8(7) << 14) |
                    (dataView.getUint8(8) << 7) |
                    dataView.getUint8(9);
        
        const metadata: Partial<AudioMetadata> = {};
        let position = 10;
        
        while (position < size + 10) {
          // Read frame header
          const frameId = String.fromCharCode(
            dataView.getUint8(position),
            dataView.getUint8(position + 1),
            dataView.getUint8(position + 2),
            dataView.getUint8(position + 3)
          );
          
          if (frameId === '\0\0\0\0') break;
          
          const frameSize = version === 4 ?
            (dataView.getUint8(position + 4) << 21) |
            (dataView.getUint8(position + 5) << 14) |
            (dataView.getUint8(position + 6) << 7) |
            dataView.getUint8(position + 7) :
            (dataView.getUint8(position + 4) << 24) |
            (dataView.getUint8(position + 5) << 16) |
            (dataView.getUint8(position + 6) << 8) |
            dataView.getUint8(position + 7);
          
          position += 10; // Skip frame header
          
          // Extract text frames
          if (frameSize > 0) {
            const encoding = dataView.getUint8(position);
            let text = '';
            
            try {
              if (encoding === 0 || encoding === 3) {
                // ISO-8859-1 or UTF-8
                const bytes = new Uint8Array(arrayBuffer, position + 1, frameSize - 1);
                text = new TextDecoder(encoding === 3 ? 'utf-8' : 'iso-8859-1').decode(bytes);
              } else if (encoding === 1 || encoding === 2) {
                // UTF-16
                const bytes = new Uint8Array(arrayBuffer, position + 1, frameSize - 1);
                text = new TextDecoder('utf-16').decode(bytes);
              }
              
              text = text.replace(/\0.*$/g, '').trim();
              
              switch (frameId) {
                case 'TIT2':
                  metadata.title = text;
                  break;
                case 'TPE1':
                  metadata.artist = text;
                  break;
                case 'TALB':
                  metadata.album = text;
                  break;
                case 'APIC':
                  // Album art frame - extract image only if not already present
                  if (!metadata.albumArt) {
                    try {
                      const imageStart = position + 1;
                      let mimeTypeEnd = imageStart;
                      
                      // Find null terminator for MIME type
                      while (mimeTypeEnd < position + frameSize && dataView.getUint8(mimeTypeEnd) !== 0) {
                        mimeTypeEnd++;
                      }
                      
                      const mimeType = new TextDecoder().decode(new Uint8Array(arrayBuffer, imageStart, mimeTypeEnd - imageStart));
                      
                      // Skip picture type and description
                      let imageDataStart = mimeTypeEnd + 2;
                      while (imageDataStart < position + frameSize && dataView.getUint8(imageDataStart) !== 0) {
                        imageDataStart++;
                      }
                      imageDataStart++;
                      
                      const imageData = new Uint8Array(arrayBuffer, imageDataStart, position + frameSize - imageDataStart);
                      const blob = new Blob([imageData], { type: mimeType });
                      metadata.albumArt = URL.createObjectURL(blob);
                    } catch (e) {
                      console.warn('Failed to extract album art:', e);
                    }
                  }
                  break;
              }
            } catch (e) {
              console.warn('Failed to decode frame:', frameId, e);
            }
          }
          
          position += frameSize;
        }
        
        return metadata;
      }
      
      return {};
    } catch (error) {
      console.warn('Failed to extract ID3 tags:', error);
      return {};
    }
  };

  return { extractMetadata };
};