import httpClient from '../../connection/httpClient';
import httpClientV3 from '../../connection/httpClientV3';

export const fetchEvents = (configurationId = null) => {
  const q = configurationId ? `&configurationId=${configurationId}` : '';
  return httpClient
    .get(`module/configuration/dropdown?contentType=EVENT${q}`)
    .then(r => r.data);
};

export const fetchCategoriesFromAPI = async () =>
  await httpClientV3.get('gallery/categories').then(r => r.data);

export async function createCategory(payload) {
  try {
    const res = await httpClientV3.post('gallery/categories', payload);
    return res.data;
  } catch (e) {
    return {status: false, message: e.message};
  }
}

export const updateCategory = async (categoryId, payload) => {
  try {
    const res = await httpClientV3.put(
      `gallery/categories/${categoryId}`,
      payload,
    );
    return res.data;
  } catch (e) {
    return {status: false, message: e.message};
  }
};

export async function deleteCategory(categoryId) {
  try {
    const res = await httpClientV3.delete(`gallery/categories/${categoryId}`);
    return res.data;
  } catch (e) {
    return {status: false, message: e.message};
  }
}

export const fetchMedia = ({
  pageNumber = 1,
  pageSize = 30,
  eventId = null,
  albumId = null,
  keyword = '',
  mediaType = '',
  categoryId = '',
  orderBy = 'order',
  orderType = -1,
  StarredOnly = false,
} = {}) => {
  const params = new URLSearchParams({
    PageNumber: pageNumber,
    PageSize: pageSize,
    OrderBy: orderBy,
    OrderType: orderType,
  });
  if (eventId) params.append('EventId', eventId);
  if (albumId) params.append('AlbumId', albumId);
  if (keyword) params.append('Keyword', keyword);
  if (mediaType) params.append('MediaType', mediaType);
  if (StarredOnly) params.append('StarredOnly', StarredOnly);
  if (categoryId && categoryId !== 'all')
    params.append('CategoryId', categoryId);
  return httpClientV3.get(`gallery?${params}`).then(r => r.data);
};

export const fetchGalleryStats = eventId =>
  httpClientV3
    .get(eventId ? `gallery/stats?eventId=${eventId}` : 'gallery/stats')
    .then(r => r.data);

export const fetchSingleMedia = mediaId =>
  httpClientV3.get(`gallery/${mediaId}`).then(r => r.data);

export const deleteMedia = mediaId =>
  httpClientV3.delete(`gallery/${mediaId}`).then(r => r.data);

export const toggleLike = mediaId =>
  httpClientV3.post(`gallery/${mediaId}/like`).then(r => r.data);

export const toggleStar = mediaId =>
  httpClientV3.post(`gallery/${mediaId}/star`).then(r => r.data);

export const fetchComments = (mediaId, page = 1, pageSize = 10) =>
  httpClientV3
    .get(`gallery/${mediaId}/comments?PageNumber=${page}&PageSize=${pageSize}`)
    .then(r => r.data);

export const addComment = (mediaId, body) =>
  httpClientV3
    .post(`gallery/${mediaId}/comments`, {Body: body})
    .then(r => r.data);

export const deleteComment = (mediaId, commentId) =>
  httpClientV3
    .delete(`gallery/${mediaId}/comments/${commentId}`)
    .then(r => r.data);

export const fetchAlbums = (eventId = null) =>
  httpClientV3
    .get(`gallery/albums${eventId ? `?eventId=${eventId}` : ''}`)
    .then(r => r.data);

export const createAlbum = dto =>
  httpClientV3.post('gallery/albums', dto).then(r => r.data);

export const editAlbum = (albumId, dto) =>
  httpClientV3.put(`gallery/albums/${albumId}`, dto).then(r => r.data);

export const deleteAlbum = albumId =>
  httpClientV3.delete(`gallery/albums/${albumId}`).then(r => r.data);

export const addMediaToAlbum = (albumId, mediaId) =>
  httpClientV3
    .post(`gallery/albums/${albumId}/media/${mediaId}`)
    .then(r => r.data);

export const uploadFileToServer = async (asset, location = 'gallery') => {
  const {Platform} = require('react-native');

  const fileSizeMB = ((asset.fileSize || 0) / (1024 * 1024)).toFixed(2);

  const formData = new FormData();
  const uri =
    Platform.OS === 'ios' ? asset.uri?.replace('file://', '') : asset.uri;

  formData.append('file', {
    uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `gallery_${Date.now()}.jpg`,
  });

  try {
    const res = await httpClient.post(
      `file/single/upload?location=${location}`,
      formData,
      {
        headers: {'Content-Type': 'multipart/form-data'},
        timeout: 5 * 60 * 1000, 
        onUploadProgress: e => {
          if (e.total) {
            const pct = Math.round((e.loaded / e.total) * 100);
          }
        },
      },
    );

    return res.data;
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return {
        status: false,
        message: `Upload timed out. File is ${fileSizeMB}MB — server may have a size limit.`,
      };
    }

    if (err.response) {
      const status = err.response.status;
      const serverMsg = err.response.data?.message || err.response.data || '';

      if (status === 413) {
        return {
          status: false,
          message: `File too large (${fileSizeMB}MB). Server rejected it.`,
        };
      }
      return {status: false, message: `Server error ${status}: ${serverMsg}`};
    }

    if (err.request) {
      return {
        status: false,
        message: `No response from server. Check your connection or file size (${fileSizeMB}MB).`,
      };
    }

    return {
      status: false,
      message:
        err?.message || err?.code || err?.description || 'Unknown upload error',
    };
  }
};

export const saveMedia = dto =>
  httpClientV3.post('gallery', dto).then(r => r.data);
