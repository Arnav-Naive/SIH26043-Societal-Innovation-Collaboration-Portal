import axiosClient from './axiosClient'

export const browseProjects = (params) =>
  axiosClient.get('/industry/projects/', { params })

export const offerSupport = (teamId, data) =>
  axiosClient.post(`/industry/projects/${teamId}/offer-support/`, data)

export const getMyPartnerships = () =>
  axiosClient.get('/industry/my-partnerships/')

export const respondToPartnership = (partnershipId, data) =>
  axiosClient.post(`/industry/partnerships/${partnershipId}/respond/`, data)

export const getTeamPartnerships = (teamId) =>
  axiosClient.get(`/industry/teams/${teamId}/partnerships/`)

export const assignMentor = (teamId, data) =>
  axiosClient.post(`/industry/projects/${teamId}/assign-mentor/`, data)

export const getTeamMentors = (teamId) =>
  axiosClient.get(`/industry/teams/${teamId}/mentors/`)

export const addMentorReview = (mentorId, data) =>
  axiosClient.post(`/industry/mentors/${mentorId}/reviews/`, data)

export const getProjectDocuments = (teamId) =>
  axiosClient.get(`/industry/teams/${teamId}/documents/`)

export const uploadProjectDocument = (teamId, data) =>
  axiosClient.post(`/industry/teams/${teamId}/documents/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const getTeamMilestones = (teamId) =>
  axiosClient.get(`/industry/teams/${teamId}/milestones/`)

export const getImpactSummary = () =>
  axiosClient.get('/industry/my-impact-summary/')
