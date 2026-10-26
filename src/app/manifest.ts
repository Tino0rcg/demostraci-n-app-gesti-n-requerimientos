import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OnlineDesk - Gestión de Requerimientos',
    short_name: 'OnlineDesk',
    description: 'Plataforma de soporte y gestión de requerimientos tecnológicos bajo SLA',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    orientation: 'portrait-primary',
    icons: [
      {
        src: 'https://github.com/Tino0rcg/fotos-Onlinedesk/blob/main/ChatGPT%20Image%2026%20jun%202026%2C%2002_08_41%20a.m..png?raw=true',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://github.com/Tino0rcg/fotos-Onlinedesk/blob/main/ChatGPT%20Image%2026%20jun%202026%2C%2002_08_41%20a.m..png?raw=true',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
