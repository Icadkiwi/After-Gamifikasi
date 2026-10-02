import { RouterProvider } from 'react-router-dom'

import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { router } from './routes/router'
import { TooltipProvider } from './components/ui/tooltip'

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
