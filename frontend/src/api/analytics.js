import axiosClient from './axiosClient'

export const getSummary = () =>
  axiosClient.get('/analytics/summary/')

export const getCategoryDistribution = () =>
  axiosClient.get('/analytics/categories/')

export const getDistrictDistribution = () =>
  axiosClient.get('/analytics/districts/')

export const getPipelineAnalytics = () =>
  axiosClient.get('/analytics/pipeline/')
