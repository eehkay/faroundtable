import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

// Import schema types
import user from './sanity-studio/schemas/user'
import dealershipLocation from './sanity-studio/schemas/dealershipLocation'
import vehicle from './sanity-studio/schemas/vehicle'
import transfer from './sanity-studio/schemas/transfer'
import activity from './sanity-studio/schemas/activity'
import comment from './sanity-studio/schemas/comment'
import importLog from './sanity-studio/schemas/importLog'

const schemaTypes = [
  user,
  dealershipLocation,
  vehicle,
  transfer,
  activity,
  comment,
  importLog
]

export default defineConfig({
  name: 'default',
  title: 'Round Table',

  projectId: 'bhik7rw7',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
  
  basePath: '/studio',
})