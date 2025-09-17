export const getFileType = filePath => {
  const imageExtensions = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'tiff',
    'tif',
    'heif',
    'heic',
    'svg',
    'ico',
    // 'jfif',
  ];

  const videoExtensions = [
    'mp4',
    'mov',
    'avi',
    'mkv',
    'wmv',
    'flv',
    'webm',
    'mpeg',
    'mpg',
    '3gp',
    '3g2',
    'mts',
    'm4v',
    'rm',
    'rmvb',
  ];

  // Extract the file extension
  const extension = filePath?.split('.')?.pop()?.toLowerCase();

  // Check if the extension matches an image or video type
  if (imageExtensions.includes(extension)) {
    return 'image';
  } else if (videoExtensions.includes(extension)) {
    return 'video';
  } else {
    return 'unknown';
  }
};
