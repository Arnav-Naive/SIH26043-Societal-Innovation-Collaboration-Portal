import axiosClient from './axiosClient'

export const getMasterData = (entity) => {
  return axiosClient.get(`/master/${entity}/`)
}

export const getDistricts = () => getMasterData('districts')

export const toggleMasterDataActive = (entity, id) => {
  return axiosClient.post(`/master/${entity}/${id}/toggle_active/`)
}

// Add these for Users, Universities, Industry if they don't exist
// We can use a generalized fetch if the endpoints exist
export const getAdminEntities = (entityType) => {
    return axiosClient.get(`/${entityType}/`)
}

export const getAIConfig = () => axiosClient.get('/master/ai-config/')
export const updateAIConfig = (data) => axiosClient.put('/master/ai-config/', data)
