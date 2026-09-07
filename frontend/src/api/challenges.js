import axiosClient from './axiosClient'

export const submitChallenge = (formData) =>
  axiosClient.post('/challenges/submit/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getMyChallenges = () =>
  axiosClient.get('/challenges/my/')

export const getAllChallenges = (params) =>
  axiosClient.get('/challenges/all/', { params })

export const getChallengeDetail = (id) =>
  axiosClient.get(`/challenges/${id}/`)

export const reviewChallenge = (id, note) =>
  axiosClient.post(`/challenges/${id}/review/`, { note })

export const routeChallenge = (id, university_id, note) =>
  axiosClient.post(`/challenges/${id}/route/`, { university_id, note })

export const updatePriority = (id, priority) =>
  axiosClient.patch(`/challenges/${id}/priority/`, { priority })

// ─── AI Categorization & Prioritization Engine ───────────────────────────────

export const acceptAIResult = (id) =>
  axiosClient.post(`/challenges/${id}/ai-override/`, { action: 'accept' })

export const overrideAI = (id, data) =>
  axiosClient.post(`/challenges/${id}/ai-override/`, { action: 'override', ...data })

export const reprocessAI = (id) =>
  axiosClient.post(`/challenges/${id}/ai-reprocess/`)

// ─── Duplicate Detection ─────────────────────────────────────────────────────

export const getDuplicateFlags = (params) =>
  axiosClient.get('/duplicate-flags/', { params })

export const reviewDuplicateFlag = (id, decision) =>
  axiosClient.patch(`/duplicate-flags/${id}/review/`, { decision })
