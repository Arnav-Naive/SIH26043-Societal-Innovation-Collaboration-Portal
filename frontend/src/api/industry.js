import axiosClient from './axiosClient'

export const browseProjects = (params) =>
  axiosClient.get('/industry/projects/', { params })

export const offerSupport = (teamId, data) =>
  axiosClient.post(`/industry/projects/${teamId}/offer-support/`, data)

export const getMyPartnerships = () =>
  axiosClient.get('/industry/my-partnerships/')

export const getTeamPartnerships = (teamId) =>
  axiosClient.get(`/industry/teams/${teamId}/partnerships/`)
