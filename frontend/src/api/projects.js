import axiosClient from './axiosClient'

export const getTeamMilestones = (teamId) =>
  axiosClient.get(`/projects/teams/${teamId}/milestones/`)

export const createMilestone = (teamId, data) =>
  axiosClient.post(`/projects/teams/${teamId}/milestones/`, data)

export const submitMilestone = (milestoneId, formData) =>
  axiosClient.post(`/projects/milestones/${milestoneId}/submit/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const reviewMilestone = (milestoneId, action, note) =>
  axiosClient.post(`/projects/milestones/${milestoneId}/review/`, { action, note })
