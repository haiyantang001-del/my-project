import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = import.meta.env.VITE_CLOUDBASE_ENV_ID || ''
const REGION = import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai'
const PUBLISH_KEY = import.meta.env.VITE_CLOUDBASE_PUBLISH_KEY || ''

const app = cloudbase.init({
  env: ENV_ID,
  region: REGION,
  accessKey: PUBLISH_KEY,
  auth: { detectSessionInUrl: true },
})

export const auth = app.auth
export const db = app.database()
export default app
