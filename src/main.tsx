import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)
const editorPreview = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('preview') === 'keymap-editor'

if (editorPreview) {
  void import('./dev/KeymapEditorPreview.tsx').then(({ KeymapEditorPreview }) => {
    root.render(
      <StrictMode>
        <KeymapEditorPreview />
      </StrictMode>,
    )
  })
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
