import {uploadFileToServer, saveMedia} from './GalleryAPI';

const listeners = new Set();
let state = {
  queue: [], 
  running: false,
  done: 0,
  total: 0,
  errors: [],
};

function notify() {
  listeners.forEach(fn => fn({...state}));
}

export function subscribeUpload(fn) {
  listeners.add(fn);
  fn({...state}); // immediate snapshot
  return () => listeners.delete(fn);
}

export function getUploadState() {
  return {...state};
}

export function enqueueUpload({
  assets,
  eventId,
  eventName,
  albumId,
  categoryId,
  caption,
  onAllDone,
}) {
  const items = assets.map(asset => ({
    asset,
    eventId,
    eventName,
    albumId,
    categoryId,
    caption,
    onAllDone,
    status: 'pending', 
    uri: asset.uri,
  }));

  state = {
    ...state,
    queue: [...state.queue, ...items],
    total: state.total + items.length,
  };
  notify();

  if (!state.running) {
    runQueue();
  }
}

export function clearCompleted() {
  state = {
    ...state,
    queue: state.queue.filter(
      i => i.status === 'pending' || i.status === 'uploading',
    ),
    done: 0,
    total: state.queue.filter(
      i => i.status === 'pending' || i.status === 'uploading',
    ).length,
    errors: [],
  };
  notify();
}

export function isUploadRunning() {
  return state.running;
}

export function cancelUpload() {
  const updatedQueue = state.queue.map(i =>
    i.status === 'pending' ? {...i, status: 'cancelled', asset: null} : i,
  );
  state = {
    ...state,
    queue: updatedQueue,
    running: false,
  };
  notify();
}

async function runQueue() {
  if (state.running) return;
  state = {...state, running: true};
  notify();

  const onAllDone = state.queue.find(i => i.status === 'pending')?.onAllDone;

  while (true) {
    const pendingIdx = state.queue.findIndex(i => i.status === 'pending');
    if (pendingIdx === -1) break;

    if (!state.running) break;

    const item = state.queue[pendingIdx];
    const updatedQueue = [...state.queue];
    updatedQueue[pendingIdx] = {...item, status: 'uploading'};
    state = {...state, queue: updatedQueue};
    notify();

    try {
      const upRes = await uploadFileToServer(item.asset, 'gallery');

      if (!upRes.status) {
        const q = [...state.queue];
        q[pendingIdx] = {...q[pendingIdx], status: 'error'};
        state = {...state, queue: q, errors: [...state.errors, item.uri]};
        notify();
      } else {
        const result = Array.isArray(upRes.result)
          ? upRes.result[0]
          : upRes.result;
        const isVideo = (item.asset.type || '').startsWith('video/');
        const dto = {
          fileUrl: result.imagePath || result.imageUrl,
          filePath: result.imagePath,
          mimeType: result.mimetype || item.asset.type,
          mediaType: isVideo ? 'video' : 'image',
          fileSize: item.asset.fileSize || null,
          eventId: item.eventId || null,
          eventName: item.eventName || null,
          albumId: item.albumId || null,
          categoryId: item.categoryId || null,
          caption: item.caption || null,
        };

        const saveRes = await saveMedia(dto);
        const q = [...state.queue];

        if (saveRes.status) {
          q[pendingIdx] = {...q[pendingIdx], status: 'done'};
          state = {...state, queue: q, done: state.done + 1};
          notify();
        } else {
          q[pendingIdx] = {...q[pendingIdx], status: 'error'};
          state = {...state, queue: q, errors: [...state.errors, item.uri]};
          notify();
        }
      }
    } catch {
      const q = [...state.queue];
      q[pendingIdx] = {...q[pendingIdx], status: 'error'};
      state = {...state, queue: q, errors: [...state.errors, item.uri]};
      notify();
    }

    const q = [...state.queue];
    if (q[pendingIdx]) {
      q[pendingIdx] = {...q[pendingIdx], asset: null};
      state = {...state, queue: q};
    }

    await new Promise(r => setTimeout(r, 100));

    if (state.done > 0 && state.done % 10 === 0) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  state = {...state, running: false};
  notify();

  onAllDone?.();
}
