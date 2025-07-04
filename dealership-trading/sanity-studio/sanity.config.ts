import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {deskStructure} from './deskStructure'

export default defineConfig({
  name: 'default',
  title: 'Round Table',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'bhik7rw7',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: deskStructure
    }), 
    visionTool()
  ],

  schema: {
    types: schemaTypes,
  },
})