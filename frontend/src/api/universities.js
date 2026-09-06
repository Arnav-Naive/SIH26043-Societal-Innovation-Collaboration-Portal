import axiosClient from './axiosClient'

export const getUniversities = () =>
  axiosClient.get('/universities/')

export const getRecommendedUniversities = (challengeId) =>
  axiosClient.get(`/universities/${challengeId}/recommend/`)

export const getAssignedChallenges = () =>
  axiosClient.get('/universities/assigned-challenges/')

export const formTeam = (challengeId, data) =>
  axiosClient.post(`/universities/challenges/${challengeId}/form-team/`, data)

export const getMyTeams = () =>
  axiosClient.get('/universities/my-teams/')

export const getFacultyTeams = () =>
  axiosClient.get('/universities/faculty-teams/')

export const getTeamDetail = (id) =>
  axiosClient.get(`/universities/teams/${id}/`)

export const updateTeam = (id, data) =>
  axiosClient.patch(`/universities/teams/${id}/`, data)

export const getFaculties = () =>
  axiosClient.get('/universities/faculties/')
