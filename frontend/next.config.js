/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ddragon.leagueoflegends.com'],
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig
