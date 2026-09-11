import axiosClient from './axiosClient'
import axios from 'axios'

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

export const registerHEI = (data) => {
  // Use plain axios (not axiosClient) for this public endpoint.
  // axiosClient adds auth headers and has a 401→redirect interceptor
  // that can interfere with unauthenticated registration calls.
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  return axios.post(`${baseURL}/universities/register/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getPendingHEIs = () =>
  axiosClient.get('/universities/pending/')

export const actionHEI = (id, data) =>
  axiosClient.post(`/universities/${id}/action/`, data)
