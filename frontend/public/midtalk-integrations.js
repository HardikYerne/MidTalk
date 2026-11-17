/* MidTalk browser API helpers. UI markup/styles are intentionally untouched. */
(function (global) {
  const apiBase = new URLSearchParams(location.search).get('api') || 'http://localhost:4000/api/v1';
  async function request(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, { credentials: 'include', ...options, headers: { 'content-type': 'application/json', ...(sessionStorage.getItem('midtalk_access_token') ? { authorization: 'Bearer ' + sessionStorage.getItem('midtalk_access_token') } : {}), ...(options.headers || {}) } });
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data?.message || data?.error || `HTTP ${response.status}`), { status: response.status, data });
    return data;
  }
  async function uploadAttachment(file, conversationId, { encrypted = false, onProgress } = {}) {
    const session = await request('/files/uploads', { method: 'POST', body: JSON.stringify({ conversationId, fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size, encrypted }) });
    const count = Math.ceil(file.size / session.partSize), parts = [];
    for (let i = 1; i <= count; i++) {
      const start = (i - 1) * session.partSize, end = Math.min(file.size, start + session.partSize);
      const { url } = await request(`/files/${session.fileId}/parts/${i}/url`, { method: 'POST', body: '{}' });
      const put = await fetch(url, { method: 'PUT', body: file.slice(start, end) });
      if (!put.ok) throw new Error(`Upload part ${i} failed (${put.status})`);
      const etag = put.headers.get('ETag'); if (!etag) throw new Error('Storage CORS must expose the ETag response header.');
      parts.push({ PartNumber: i, ETag: etag }); onProgress?.({ loaded: end, total: file.size, percent: Math.round(end / file.size * 100) });
    }
    await request(`/files/${session.fileId}/complete`, { method: 'POST', body: JSON.stringify({ parts }) });
    return { fileId: session.fileId, fileName: file.name, size: file.size };
  }
  global.MidTalkAPI = Object.freeze({ request, uploadAttachment, getMeetingJoinToken: id => request(`/meetings/${id}/join-token`, { method: 'POST', body: '{}' }), createMeeting: input => request('/meetings', { method: 'POST', body: JSON.stringify(input) }), getCommunities: () => request('/communities'), getProjects: () => request('/projects'), getAgent: () => request('/agent'), setMeetingConsent: (id, consent) => request(`/meetings/${id}/consent`, { method: 'POST', body: JSON.stringify(consent) }), transcribeMeetingAudio: (id, file) => { const form = new FormData(); form.append('file', file); return fetch(`${apiBase}/meetings/${id}/transcribe`, { method: 'POST', credentials: 'include', body: form }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); return d; }); }, summarizeMeeting: id => request(`/agent/meetings/${id}/summarize`, { method: 'POST', body: '{}' }), createCommunity: input => request('/communities', { method: 'POST', body: JSON.stringify(input) }), createProject: (communityId, input) => request(`/communities/${communityId}/projects`, { method: 'POST', body: JSON.stringify(input) }) });
})(window);
